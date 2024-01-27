//@ts-check
import { MutableStateList, el, renderAttoCompoment, state, stateList, stateListen, stateMap, stateSet } from "./atto.js"

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

const TodoEditor = () => {
    /** @type {MutableStateList<string>} */
    const todosState = stateList(["Wash dishes", "Take out trash."]);
    const upp = todosState.fmap((_, i) => {
        return i.toUpperCase();
    });
    todosState.push("New element.");

    const todoContentEditor = el('input', {
        type: 'text',
        placeholder: 'Todo content.',
        style: 'flex-grow: 1;'
    });
    const todoAddBtn = el('input', {
        type: 'button',
        value: 'Add',
        onclick: () => {
            let value = todoContentEditor.element['value'];

            if (value) {
                todoContentEditor.element['value'] = '';
                todosState.push(value);
            }
        }
    });

    const todoEditor = FlexRow(todoContentEditor, todoAddBtn);

    const todoView = FlexColumn(
        todosState.fmap((_, todo) =>
            el('input', { type: 'text', placeholder: todo })
        )
    );

    return FlexColumn(
        todoEditor,
        todoView
    );
}

renderAttoCompoment(
    document.querySelector('body'),
    TodoEditor
)