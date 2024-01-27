# Atto

A small library for creating html elements using functional-reactive programming.

Under 2 KB (minified) of special types for reactivity and component creation using functional patterns for maximal composability.

It requires absolutely no setup -- just include it from html or JS, and you'll get typescript-powered type checking from its documentation comments.

### States

You can create states like this.
A state is a functor over the value it wraps, so you can expect to do a few things with it.

```js
let num = state(0);
let num2 = state(1);

/// Subscribe to the state (for_each).
stateListen(num, (oldValue, newValue) => console.log(`Value changed to ${newValue}!!!`));

/// Derive a new state (functor map).
let str = stateMap(num, (newValue) => `${newValue}`);

/// Derive a new state from multiple input states (functor zip).
let numSum = stateZip([num, num2], (x, y) => x + y);

/// Set a state (triggering, i.e., notifying subscribers).
stateSet(num, 8);
```

### AttoComponents

You can create atto components with the `el` function.
Atto components, and the el function, interact natively with the signal types
to re-render when you need it to.

```js
// Pass children (like text), or other elements.
let component = el('p', 'Hello, World!');

// Pass attributes using objects.
let button = el('button', 'Click me', { onclick: () => alert("Hello!") });

// Highly, easily composable since it's function based.
const FlexColumn = (...args) => {
    return el('div',
        {
            style: `
                width: 100%;
                max-width: 500px;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 0.5rem;
            `
        },
        ...args
    )
};
```

Here's a counter example (an example of a counter, that is):

```js
const Counter = () => {
    let number = state(0);

    // Deriving the label text from the number state.
    let labelText = number.map((_, n) => `Counter: ${n}`);
    const label = el('p', labelText);
    
    const increaseBtn = el('button',
        {
            onclick: () =>
                // Setting the state, notifying subscribers.
                stateSet(number, number.value + 1)
        },
        'Increase!',
    );

    // Using previously defined flex column function.
    return FlexColumn(
        label,
        increaseBtn
    )
}

// Render a counter to body.
renderAttoCompoment(
    document.querySelector('body'),
    Counter
)
```