let proxies = window.__ALPINE_REACTIVE_PROPERTIES__ = new WeakMap
let refs = window.__ALPINE_REFS__ = new WeakSet

let reactiveHandler = () => ({
    __alpine_componentEls: [],
    __watchers: [],

    get (target, key, value, receiver) {
        if (key === '__alpine_componentEls' || key === '__watchers') {
            return this[key]
        }

        let result = Reflect.get(target, key, value, receiver)

        return result
    },

    set(target, key, value, receiver) {
        Reflect.set(target, key, value, receiver)

        for (const el of this.__alpine_componentEls) {
            if (el && document.contains(el) && el.__x) {
                setTimeout(() => el.__x.updateElements(el), 0)
            }
        }

        for (const watcher of this.__watchers) {
            watcher(key, value)
        }

        return true
    },
})

export function isRef(value) {
    return refs.has(value)
}

export function unRef(value) {
    return isRef(value) ? value.value : value
}

export function ref(value) {
    const obj = { value }

    refs.add(obj)

    return obj
}

export function isReactiveProxy(proxy) {
    return proxy && proxy.__alpine_componentEls !== undefined
}

export function reactive(value, componentEl = null) {
    let result

    if (isReactiveProxy(value)) {
        // The value is a reactive() proxy, so we use it immediately
        result = value
    } else if (proxies.has(value)) {
        // The value is not a reactive() proxy, but we found that there
        // is a registered proxy for the object in value, so we get it.
        result = proxies.get(value)
    } else {
        // There's no proxy available, so we create one.
        result = new Proxy(value, reactiveHandler())
        proxies.set(value, result)
    }

    if (componentEl && ! result.__alpine_componentEls.includes(componentEl)) {
        result.__alpine_componentEls.push(componentEl)
    }

    return result
}

export function watch(proxy, callback, key = null) {
    if (! proxy || ! proxy.__watchers) {
        return
    }

    if (key) {
        proxy.__watchers.push((k, v) => {
            if (k === key) {
                callback(v)
            }
        })
    } else {
        proxy.__watchers.push(callback)
    }
}

export function addMagicProperty() {
    window.Alpine.addMagicProperty('reactive', el => {
        return function (property) {
            return reactive(property, el)
        }
    })
}

window.__ALPINE_REACTIVE_REGISTERED__ = false

export function register() {
    if (! window.__ALPINE_REACTIVE_REGISTERED__) {
        const deferrer = window.deferLoadingAlpine || function (callback) { callback() }

        window.deferLoadingAlpine = function (callback) {
            addMagicProperty()

            deferrer(callback)
        }

        window.__ALPINE_REACTIVE_REGISTERED__ = true
    }
}

register()
