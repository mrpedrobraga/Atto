//@ts-check
import { el, renderAttoCompoment, state, stateListen, stateMap, stateSet } from "./atto.js"

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
}

const Counter = () => {
    let number = state(0);

    const label = el('p', number.map((_, n) => `Counter: ${n}`));
    const increaseBtn = el('button',
        {
            onclick: () =>
                stateSet(number, number.value + 1)
        },
        'Increase!',
    );

    return FlexColumn(
        label,
        increaseBtn
    )
}

renderAttoCompoment(
    document.querySelector('body'),
    Counter
)