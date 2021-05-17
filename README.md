# alpine-reactive

This package provides a reactivity layer for Alpine 2.x.

## Problem

When you create a component that uses a value defined outside of it, you can modify the value from Alpine, but not vice versa:

```html
<div x-data="{ counter: window.clickCount }">
    <button @click="counter++">+</button>
    Click count: <span x-text="count" />
    <button @click="counter++">--</button>
</div>
```

Clicking the buttons **will** update `window.clickCount`. However when `window.clickCount` is modified outside of the component, Alpine **won't** notice, and won't re-render the DOM.

Only after something else triggers a re-render, Alpine will show the correct click count again.

## Solution

This package provides a reactive proxy wrapper for these objects. The syntax is very similar to Vue 3 — you just wrap the variable in `reactive()` and all changes will be tracked.

One difference between this package's solution and Vue's `reactive()` is that Alpine requires the calls to be **component-specific**. Meaning, the `reactive()` helper also needs the component instance/element. To simplify that, the package also provides a magic Alpine property, `$reactive`.

## Installation

### npm

```sh
npm install --save-dev @archtechx/alpine-reactive
```

Then import the library **before importing Alpine**:
```js
import '@archtechx/alpine-reactive'

// import 'alpinejs'
```

To create reactive proxies, import the `reactive` helper:

```js
import { reactive } from '@archtechx/alpine-reactive'

window.clickCounter = reactive({
    counter: 10,
})
```

The Alpine hook is executed automatically regardless of what parts of the library you import. For a full reference of the available helpers, see the [Full API](#full-api) section below.

### CDN

```html
<script type="module">
    import { reactive } from 'https://unpkg.com/@archtechx/alpine-reactive'

    window.clickCounter = reactive({
        counter: 10,
    })

    // If you want to use reactive() outside of this script tag:
    // window.reactive = reactive
</script>
```

## Demo

[View online](https://archtechx.github.io/alpine-reactive/demo.html)

```html
<script>
    window.counter = reactive({
        count: 10,
    })
</script>

<div x-data="{ counter: $reactive(window.counter) }">
    <button @click="counter.count--">-</button>
    Click count: <span x-text="counter.count"></span>
    <button @click="counter.count++">+</button>
</div>
```

Under the hood, this creates a proxy that forwards everything to `window.clickCount`, but observes changes made to `window.clickCount` and updates the component as needed.

Of course, you may use the same reactive proxy in multiple components.

## Full API

### reactive(target, componentEl = null): Proxy for target

This creates a reactive proxy for `object`. If `componentEl` is passed, all writes to this proxy will trigger `updateElements()` on `componentEl`'s Alpine instance.

### ref(val): { value: val }

This turns `foo` into `{ value: foo }`, which allows for `foo` — a primitive type in this example — to be used with proxies.

### isRef(value): bool

Checks if a value is a ref.

### unRef(value)

Syntactic sugar for `isRef(value) ? value.value : value`.

### isReactiveProxy(proxy): bool

Checks whether the passed variable is a value returned by `reactive()`.

### watch(target, (key, value) => void) or watch(target, value => void), property)

Watches a reactive proxy, or a property on the reactive proxy.

Example:
```js
watch(window.counter, (key, value) => console.log(`${key} was changed to ${value}`)); // Watch proxy
watch(window.counter, count => console.log(count), 'count'); // Watch property
```

## Details

The package provides a `$reactive` magic property for Alpine. That property is syntactic sugar for `reactive(target, $el)`.

```diff
- counter: reactive(window.counter, $el)
+ counter: $reactive(window.counter)
```

The magic property is added using the exported `addMagicProperty()` function, which is called once Alpine is available by the `register()` function. `register()` is called automatically for friendly CDN imports.
