export class AttoComponent {
    /**
     * @type {HTMLElement}
     */
    element
}

/** @typedef {() => AttoComponent} AttoComponentFactory */

/**
 * Represents all the attributes for all the native dol element types.
 * @typedef {{ [string]: any } }} _AttoAttrList
 */

/**
 * Represents a list of attributes for a specific Atto component.
 * @template {keyof _AttoAttrList} E
 * @typedef {_AttoAttrList[E]} AttoAttributeList
 */

/**
 * Represents a parameter list for an Atto component created with [$].
 * @template {keyof _AttoAttrList} E
 * @typedef {(AttoComponent | string | AttoAttributeList<E>)[]} AttoParameterList
 */

/** @returns {HTMLElement} */
function makeInnerContainer() {
    const innerContainer = document.createElement('div');
    innerContainer.style.display = "contents";
    return innerContainer;
}

/**
 * A function to create Atto components with attributes and children.
 * @template {keyof _AttoAttrList} E
 * @param {E} tag_name - The type of Dol element.
 * @param {AttoParameterList<E>} args - The parameter list for the Dol element.
 * @returns {AttoComponent} A Dol element.
 */
export function el(tag_name, ...args) {
    const element = document.createElement(tag_name);
    let atto_component = new AttoComponent();
    atto_component.element = element;

    args.forEach((arg) => {
        populateElement(element, arg);
    });

    return atto_component;
}

function populateElement(element, arg) {
    if (typeof arg === 'string') {
        element.appendChild(document.createTextNode(arg));
    } else if (arg instanceof MutableState) {
        const state = arg;
        const innerContainer = makeInnerContainer();
        element.appendChild(innerContainer);
        const updateInnerContainer = (_, new_value) => {
            innerContainer.innerHTML = "";
            populateElement(innerContainer, new_value);
        }
        stateListen(state, updateInnerContainer);
        updateInnerContainer(undefined, state.value);
    } else if (arg instanceof AttoComponent) {
        element.appendChild(arg.element);
    } else {
        // Set attribute.
        const attribList = arg;

        Object.keys(attribList).forEach((key) => {
            const val = attribList[key];
            if (val instanceof MutableState) {
                // Handle signal updates!
            } else {
                element[key] = val;
            }
        });
    }
}

/**
 * Creates a new Atto component into a fragment,
 * insulated on a div (with "display: contents;").
 * @param {*} container 
 * @param {AttoComponentFactory} factory 
 */
export function renderAttoCompoment(container, factory) {
    const comp = factory();
    const innerContainer = makeInnerContainer();
    innerContainer.appendChild(comp.element);
    container.appendChild(innerContainer);
}

/**
 * @template T
 * @typedef {(oldValue: T, newValue: T) => void} StateCallback
 */

/**
 * @template T
 */
export class MutableState {
    /**
     * @type T
     */
    value

    /**
     * @type StateCallback<T>[]
     */
    callbacks

    /**
     * @param {T} initialValue 
     */
    constructor(initialValue) {
        this.value = initialValue;
        this.callbacks = [];
    }

    /**
     * 
     * @param {StateCallback<T>} callback 
     * @returns 
     */
    map(callback) {
        return stateMap(this, callback)
    }
}

/**
 * @template T
 * @param {MutableState<T>} state 
 * @param {T} newValue 
 */
export function stateSet(state, newValue) {
    let oldValue = state.value;
    state.value = newValue;
    state.callbacks.forEach(
        (callback) =>
            callback(oldValue, newValue)
    );
}

/**
 * @template T
 * @param {MutableState<T>} state
 * @param {StateCallback<T>} callback
 * @returns void
 */
export function stateListen(state, callback) {
    state.callbacks.push(callback)
}

/**
 * @template T
 * @param {MutableState<T>} state
 * @param {StateCallback<T>} callback
 * @returns State<T>
 */
export function stateMap(state, callback) {
    const s = new MutableState(callback(state.value, state.value));
    state.callbacks.push((o, v) => stateSet(s, callback(o, v)));
    return s;
}

/**
 * @template {any[]} TStateDerives
 * @template T
 * @param {{ [K in keyof TStateDerives]-?: MutableState<TStateDerives[K]> } } states
 * @param {(...derives: TStateDerives) => T} derive
 * @returns State<T>
 */
export function stateZip(states, derive) {
    /** @type {(s: MutableState<T>, o: any, n: any) => void} */
    const sUpdate = (s, _o, _n) => {
        /** @type * */
        let _x = states.map(s => s.value);
        stateSet(s, derive(..._x))
    }
    const s = new MutableState(undefined);
    states.forEach(st => stateListen(st, (_o, _n) => sUpdate(s, undefined, undefined)))
    sUpdate(s, undefined, undefined);
    return s;
}

/**
 * @template T
 * @param {T} initialValue
 * @returns {MutableState<T>}
 */
export function state(initialValue) {
    return new MutableState(initialValue);
}