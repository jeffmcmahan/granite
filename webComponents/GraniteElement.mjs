import { render as renderLit, html } from '/public/lit-html/lit-html.js'

export class GraniteElement extends HTMLElement {

	#rendering = false

	constructor() {
		super()
		this.#setupTemplate()
	}

	get name() {
		return this.getAttribute('name')
	}

	get label() {
		return this.getAttribute('label')
	}

	get hint() {
		return this.getAttribute('hint')
	}

	get placeholder() {
		return this.getAttribute('placeholder')
	}

	get invalid() {
		return this.hasAttribute('invalid')
	}

	get warn() {
		return this.hasAttribute('warn')
	}

	get required() {
		return this.hasAttribute('required')
	}

	get readOnly() {
		return this.hasAttribute('readOnly')
	}

	get disabled() {
		return this.hasAttribute('disabled')
	}

	connectedCallback() {
		if (this.isConnected) {
			this.#render()
		}
		if (this.componentDidMount) {
			this.componentDidMount()
		}
    }

	#nextDebounced

	debounce(ms, cb) {
		if (this.#nextDebounced) {
			this.#nextDebounced = cb
		} else {
			this.#nextDebounced = cb
			setTimeout(() => {
				this.#nextDebounced()
				this.#nextDebounced = null
			}, ms)
		}
	}

	/**
	 * Creates a template node and inserts an empty <div> to act as the
	 * host for the Component.
	 * @returns {undefined}
	 */
	#setupTemplate() {
		const tmpl = document.createElement('template')
		tmpl.innerHTML = '<div></div>'
		document.body.append(tmpl)
		this.attachShadow({mode: 'open'})
			.appendChild(tmpl.content.cloneNode(true))
		this.mount = this.shadowRoot.querySelector('div')
	}

	/**
	 * Renders the styles and the output of the child's render() method
	 * into the mount node.
	 * @returns {undefined}
	 */
	#render() {
		const view = html`<style>${this.css}</style>${this.render()}`
		renderLit(view, this.mount)
	}

	#postUpdateCallbacks = []

	/**
	 * Async re-renders the component after applying the update.
	 * @returns {undefined}
	 */
	setState(newState = {}, postUpdateCb) {
		Object.assign((this.state || {}), newState)
		if (postUpdateCb) {
			this.#postUpdateCallbacks.push(postUpdateCb)
		}
		if (!this.#rendering) {
			this.#rendering = true
			requestAnimationFrame(() => {
				this.#render()
				while (this.#postUpdateCallbacks.length) {
					this.#postUpdateCallbacks.pop()()
				}
				this.#rendering = false
			})
		}
	}
}
