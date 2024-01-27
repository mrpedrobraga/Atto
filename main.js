//@ts-check
import { MutableStateList, el, MutableState, renderAttoCompoment, state, stateList, stateListen, stateMap, stateSet } from "./atto.js"

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

const FlexRow = (...args) => {
    return el('div',
        {
            style: `
                width: 100%;
                max-width: 500px;
                display: flex;
                flex-direction: row;
                gap: 0.5rem;
                padding: 0.5rem;
            `
        },
        ...args
    )
}

const SingleTodoEditor = (todoState) => {
    const input = el('input', {
        type: 'text',
        value: todoState,
        style: "flex-grow: 1"
    });

    const button = el('input', {
        type: 'button',
        value: 'Save',
        onclick: () =>
            todoState.set(input.element['value'])
    });

    return FlexRow(
        input,
        button
    );
};

const TodoEditor = () => {
    /** @type {MutableStateList<MutableState<string>>} */
    const todosState = stateList([]);

    const todoAddBtn = el('input', {
        type: 'button',
        value: 'Add',
        onclick: () => {
            todosState.push(state("New Todo"))
        }
    });

    const todoView = FlexColumn(
        todosState.fmap((_, todo) =>
            SingleTodoEditor(todo)
        )
    );


    return FlexColumn(
        todoAddBtn,
        todosState.fmap((_, todo) => el('p', todo)),
        todoView
    );
}

renderAttoCompoment(
    document.querySelector('body'),
    TodoEditor
)