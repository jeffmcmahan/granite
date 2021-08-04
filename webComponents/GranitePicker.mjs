import { html, render as renderLit } from '/public/lit-html/lit-html.js'
import { GraniteElement } from './c.GraniteElement.mjs'
import { black, white, red, green, blue, yellow } from '../color-palette.mjs'

class GranitePicker extends GraniteElement {

	css = `
	.container {
		background-color: ${white};
		border-radius: 5px;
		box-shadow:
			0 0 0 2px ${black.alpha(0.04)},
			0 0 0 4px ${black.alpha(0.04)},
			0 2px 0 0 ${black.alpha(0.1)};
		overflow: hidden;
		position: relative;
		transition: height 300ms ease-in-out 125ms;
	}
	.container.open {
		transition: height 300ms ease-in-out;
	}
	.container.invalid {
		border-left: 5px solid ${red};
	}
	.container.warn {
		border-left: 5px solid ${yellow.deepen(0.1)};
	}
	.header-main {
		align-items: center;
		display: flex;
		justify-content: flex-start;
		height: 22px;
		padding: 10px 12px;
	}
	.label-area {
		align-items: center;
		display: flex;
		height: 32px;
	}
	.label-txt {
		color: ${black.tint(0.33)};
		flex-grow: 0;
		font-size: 11.5px;
		font-family: 'Roboto Condensed', 'Roboto', sans-serif;
		font-weight: 600;
		user-select: none;
	}
	.text-editable-area {
		align-items: center;
		display: flex;
		flex-grow: 2;
		height: 32px;
		position: relative;
	}
	.description-txt {
		color: ${black.tint(0.66)};
		font-style: italic;
		font-family: 'Roboto Condensed', 'Roboto', sans-serif;
		opacity: 1;
		position: absolute;
		transition: opacity 100ms ease-in-out;
		user-select: none;
		z-index: 1;
	}
	.description-txt::before {
		content: '-';
		padding: 0 8px;
	}
	.hint-txt {
		color: ${black.tint(0.4)};
		font-family: 'Roboto Condensed', 'Roboto', sans-serif;
		font-size: 11.5px;
		font-style: italic;
		opacity: 1;
		position: absolute;
		transition: opacity 100ms ease-in-out;
		right: 10px;
	}
	.selections {
		display: flex;
		flex-direction: column;
		padding: 0 10px 0 26px;
	}
	.selection {
		cursor: pointer;
		display: flex;
		font-family: 'Roboto Condensed', 'Roboto', sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		height: 30px;
	}
	.selection-inner {
		align-items: center;
		background: ${green.deepen(0.15)};
		border-radius: 12px;
		color: ${white};
		display: flex;
		padding: 4px 8px 4px 6px;
		height: 16px;
	}
	.selection-inner img {
		margin-right: 4px;
		width: 16px;
	}
	.search-container {
		align-items: center;
		background: ${white.alpha(0.85)};
		border-bottom: 1px solid ${white.shade(0.08)};
		display: flex;
		height: 32px;
		padding: 0 4px 0 6px;
		position: sticky;
		top: 0;
	}
	.search-container img {
		margin-right: 3px;
		width: 18px;
	}
	.search-input {
		all: unset;
		background: transparent;
		appearance: none;
		-webkit-appearance: none;
		flex-grow: 2;
	}
	.options {
		background: ${white};
		border-top: 1px solid ${white.shade(0.08)};
		overflow: scroll;
		position: absolute;
		top: 43px;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0;
		transition: opacity 100ms linear; 
	}
	.open .options {
		opacity: 1;
		transition: opacity 100ms linear 325ms; 
	}
	.option {
		align-items: center;
		color: ${black.tint(0.25)};
		cursor: pointer;
		display: flex;
		font-size: 11.5px;
		font-weight: 600;
		font-family: 'Roboto Condensed', 'Roboto', sans-serif;
		height: 32px;
		padding: 0 10px 0 27px;
	}
	.option.selected {
		background: ${blue};
		color: ${white};
	}
	.caret {
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 6px solid ${white.shade(0.15)};
		height: 0; 
		margin-right: 5px;
		width: 0; 
	}`

	state = {
		uid: ('x' + String(Math.random()).slice(2)),
		open: false,
		searchQuery: '',
		results: null,
	}

	componentDidMount() {
		this.#createPortalForHiddenInputs()
		this.#manageSubmit()
		this.#hideOnBlur()
	}

	get hint() {
		return (this.required && !this.value.length)
			? 'required'
			: this.getAttribute('hint')
	}

	get description() {
		return this.getAttribute('description') || 'Tip: Add a description attribute.'
	}

	#hideOnBlur() {
		document.addEventListener('mouseup', evt => {
			if (this.state.open && !this.contains(evt.target)) {
				this.setState({open: false})
			}
		})
	}

	/**
	 * Injects a set of hidden <inputs> which will record the selected
	 * values in a way visible to a parent <form>.
	 * @returns {undefined}
	 */
	#createPortalForHiddenInputs() {
		this.hiddenInputsMount = document.createElement('div')
		this.hiddenInputsMount.style.display = 'none'
		this.parentNode.insertBefore(this.hiddenInputsMount, this)
	}

	/**
	 * Find the ancestor <form> element and watch for a submit event, and
	 * then prevent it if this field is not valid.
	 * @returns {undefined}
	 */
	#manageSubmit() {
		let form, ancestor, levels = 0
		while (!form && ++levels > 20) {
			ancestor = this.parentNode
			if (ancestor.nodeName === 'FORM') {
				form = ancestor
			}
		}
		if (form) {
			form.addEventListener('submit', evt => {
				if ((this.required && !this.value) || this.invalid) {
					evt.preventDefault()
					alert(`Please provide a valid value for ${this.label || this.name}.`)
				}
			})
		}
	}

	/**
	 * Filters the options against the given query string.
	 * @param {String} query
	 * @returns {Object[]}
	 */
	#filterResults(query) {
		if (query) {
			query = query.toLowerCase()
			return this.options.filter(opt => {
				const name = ('' + this.optionToName(opt)).toLowerCase()
				const val = ('' + this.optionToValue(opt)).toLowerCase()
				return (name.includes(query) || val.includes(query))
			})
		}
		return this.options
	}

	/**
	 * Debounces the #filterResults fn and renders the updated query.
	 * @param {Event} evt
	 * @returns {undefined}
	 */
	#executeSearch(evt) {
		const searchQuery = evt.target.value
		this.setState({searchQuery})
		this.debounce(250, () => this.setState({
			results: this.#filterResults(searchQuery)
		}))
	}

	/**
	 * Initializes the results state variable and returns it, limited to
	 * a length of <=100 to avoid huge numbers of option nodes.
	 * @returns {Object[]}
	 */
	#getResults() {
		if (!this.state.results) {
			this.state.results = (this.options ?? [])
		}
		return this.state.results
			.filter(opt => !this.value.includes(opt))
			.slice(0, 100)
	}

	#hasSearch() {
		return this.options.length >= 20
	}

	#focusSearchInput() {
		if (this.#hasSearch()) {
			this.shadowRoot.querySelector('.search-input').focus()
		}
	}

	/**
	 * Generates the search <input> field and icon.
	 * @returns {TemplateResult}
	 */
	#searchInput() {
		if (!this.#hasSearch()) {
			return null
		}
		return html`<div class="search-container">
			<img 
				@click=${() => this.#focusSearchInput()}
				src="/icon?name=ikonate/search&weight=2px&color=${white.shade(0.15).rgb}">
			<input
				class="search-input"
				@input=${(evt) => this.#executeSearch(evt)}>
		</div>`
	}

	/**
	 * Toggles the selection of the given option object.
	 * @note Triggers re-render and fires @input on <labeled-select>.
	 * @param {Object} opt
	 * @returns {undefined}
	 */
	#selectOption(opt) {
		if (this.value.includes(opt)) {
			const valuePos = this.value.indexOf(opt)
			if (~valuePos) {
				this.value.splice(valuePos, 1)
			}
		} else {
			this.value.push(opt)
		}
		this.dispatchEvent(new Event('input'))
		this.setState({})
	}

	/**
	 * Generates a selectable option view to populate the list of options.
	 * @param {Object} opt
	 * @returns {TemplateResult}
	 */
	#optionView(opt) {
		return html`<div class="option" @click=${() => this.#selectOption(opt)}>
			${this.optionToName(opt)}
		</div>`
	}

	/**
	 * Generates one green checkmarked selected item that can be clicked to
	 * deselect it.
	 * @param {Object} opt
	 * @returns {TemplateResult}
	 */
	#selectionView(opt) {
		return html`<div class="selection" @click=${() => this.#selectOption(opt)}>
			<span class="selection-inner">
				<img src="/icon?name=ikonate/ok&weight=2px&color=${white.rgb}">
				${this.optionToName(opt)}
			</span>
		</div>`
	}

	/**
	 * Generates the green checkmark list of things that are selected.
	 * @returns {TemplateResult}
	 */
	#selections() {
		return html`<div class="selections">
			${this.value.map(opt => this.#selectionView(opt))}
		</div>`
	}

	/**
	 * Renders the portal-bound set of hidden <inputs> outside the shadowDOM
	 * to make the selections/value of this input visible/available for 
	 * submission via a parent <form>.
	 * @returns {undefined}
	 */
	#renderHiddenInputs = () => {
		if (this.hiddenInputsMount) {
			const inputs = this.value.map(opt => {
				return html`<input 
					type="hidden" 
					name=${this.name} 
					value=${this.optionToValue(opt)}
				/>`
			})
			renderLit(inputs, this.hiddenInputsMount)
		}
	}

	/**
	 * Calculate some critical measurements.
	 * @returns {Object}
	 */
	#calculateHeight() {
		const selectionsHeight = (this.value.length * 32)
		let outerHeight = 42 + selectionsHeight
		if (this.state.open) {
			outerHeight += ((this.state.results.length * 32) + 32)
		}
		if (outerHeight > 275) {
			outerHeight = 275
		}
		return {
			outerHeight,
			selectionsHeight,
		}
	}

	#toggle() {
		if (this.state.open) {
			this.setState({open: false})
		} else {
			this.setState({open: true}, () => {
				setTimeout(() => {
					this.#focusSearchInput()
					this.shadowRoot.querySelector('.options').scrollTop = 0
				}, 150)
			})
		}
	}

	render() {
		this.#renderHiddenInputs()

		const { open } = this.state
		const classes = ('container') + (open ? ' open' : '')
		const {outerHeight, selectionsHeight } = this.#calculateHeight()

		return html`
		<div tabIndex=-1 class=${classes} style="height: ${outerHeight}px;">
			<div class="header">
				<div class="header-main" @click=${() => this.#toggle()}>
					<div class="label-area">
						<div class="caret"></div>
						<div class="label-txt">${this.label}</div>
					</div>
					<div class="text-editable-area">
						<div class="description-txt">${this.description}</div>
						<div class="hint-txt">${this.hint}</div>
					</div>
				</div>
				${this.#selections()}
			</div>
			<div class="options" style="top:${selectionsHeight + 43}px">
				${this.#searchInput()}
				${this.#getResults().map(opt => this.#optionView(opt))}
			</div>
		</div>`
	}
}

customElements.define('granite-picker', GranitePicker)