export class AttoComponent {
    /**
     * @type {HTMLElement}
     */
    element
}

/** @typedef {() => AttoComponent} AttoComponentFactory */

/**
 * Represents all the attributes for all the native dol element types.
 * @typedef {Record<String, any>} }} _AttoAttrList
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
        appendAttoElement(element, arg);
    });

    return atto_component;
}

function appendAttoElement(element, arg) {
    if (Array.isArray(arg)) {
        arg.map((argItem) => appendAttoElement(element, argItem))
    } else if (typeof arg === 'string') {
        element.appendChild(document.createTextNode(arg));
    } else if (arg instanceof MutableStateList) {
        const state = arg;
        const innerContainer = makeInnerContainer();
        element.appendChild(innerContainer);
        stateListen(state, (_, [diffOp, diffContent]) => {
            switch (diffOp) {
                case 'push':
                    appendAttoElement(innerContainer, diffContent);
                    break;
            }
        });
        state.value.map((v) => {
            appendAttoElement(innerContainer, v);
        });
    } else if (arg instanceof MutableState) {
        const state = arg;
        const innerContainer = makeInnerContainer();
        element.appendChild(innerContainer);
        const updateInnerContainer = (_, new_value) => {
            innerContainer.innerHTML = "";
            appendAttoElement(innerContainer, new_value);
        }
        stateListen(state, updateInnerContainer);
        updateInnerContainer(undefined, state.value);

    } else if (arg instanceof AttoComponent) {
        element.appendChild(arg.element);
    } else if (arg == null || arg == undefined) {
        console.log("why is this undefined wtf")
        console.trace("undeifned");
    } else {
        // Set attribute.
        const attribList = arg;

        Object.keys(attribList).forEach((key) => {
            const val = attribList[key];
            if (val instanceof MutableState) {
                const state = val;
                const updateAttr = (_, newValue) => { element[key] = newValue; }
                stateListen(state, updateAttr);
                updateAttr(undefined, state.value);
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
 * @template U
 * @typedef {(oldValue: T, newValue: T) => U} StateCallback
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
     * @template U
     * @param {StateCallback<T, U>} callback 
     * @returns {MutableState<U>}
     */
    map(callback) {
        return stateMap(this, callback)
    }

    /**
     * 
     * @param {T} newValue 
     */
    set(newValue) {
        stateSet(this, newValue)
    }
}

/**
 * @typedef {'push'} MutableStateListOperation
 */

/**
 * @template T
 * @extends {MutableState<T[]>}
 */
export class MutableStateList extends MutableState {
    /**
     * @type [MutableState, StateCallback<any>][]
     */
    derived

    constructor(initialValue) {
        super(initialValue);
        this.derived = [];
    }

    /**
     * @template U
     * @param {StateCallback<T, U>} callback 
     * @returns {MutableStateList<U>}
     */
    fmap(callback) {
        return stateListFlatMap(this, callback)
    }

    /**
     * 
     * @param {T} newValue 
     */
    push(newValue) {
        this.value.push(newValue);
        for (const [derState, derCallback] of this.derived) {
            derState.push(derCallback(undefined, newValue));
        }
        stateNotify(this, undefined, ['push', newValue]);
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
    stateNotify(state, oldValue, newValue);
}

/**
 * @template T
 * @param {MutableState<T>} state 
 * @param {T} newValue 
 */
export function stateNotify(state, oldValue, newValue) {
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
 * @template U
 * @param {MutableState<T>} state
 * @param {StateCallback<T, U>} callback
 * @returns {MutableState<U>}
 */
export function stateMap(state, callback) {
    const s = new MutableState(callback(state.value, state.value));
    state.callbacks.push((o, v) => stateSet(s, callback(o, v)));
    return s;
}

/**
 * @template T
 * @template U
 * @param {MutableState<T>} state
 * @param {StateCallback<T, U>} callback
 * @returns {MutableStateList<U>}
 */
export function stateListFlatMap(state, callback) {
    const s = new MutableStateList(state.value.map(i => callback(i, i)));
    //state.callbacks.push((o, v) => stateSet(s, callback(o, v)));

    state.derived.push([s, callback]);
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

/**
 * @template T
 * @param {T[]} initialValue
 * @returns {MutableStateList<T>}
 */
export function stateList(initialItems = []) {
    return new MutableStateList([...initialItems]);
}