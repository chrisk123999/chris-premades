let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils} from '../utils.js';
export class CPRSingleRollResolver extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, options={}) {
        super(options);
        this.#roll = roll;
    }
    static DEFAULT_OPTIONS = {
        id: 'roll-resolver-{id}',
        tag: 'form',
        window: {
            title: 'DICE.RollResolution',
        },
        position: {
            width: 500,
            height: 'auto'
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: false,
            handler: CPRSingleRollResolver._fulfillRoll
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/roll-resolver-single-form.hbs'
        },
        quickButtons: {
            template: 'modules/chris-premades/templates/roll-resolver-quick-buttons.hbs'
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        }
    };
    get fulfillable() {
        return this.#fulfillable;
    }
    #fulfillable = new Map();
    #resolve;
    get roll() {
        return this.#roll;
    }
    #roll;
    async awaitFulfillment() {
        const fulfillable = await this.#identifyFulfillableTerms(this.roll.terms);
        if ( !fulfillable.length ) return;
        Roll.defaultImplementation.RESOLVERS.set(this.roll, this);
        let promise = new Promise(resolve => this.#resolve = resolve);
        if (this.checkPreferences()) this.render(true);
        else await this.digitalRoll();
        return promise;
    }
    checkPreferences() { 
        if (this.roll instanceof CONFIG.Dice.DamageRoll) return false;
        if (!genericUtils.getCPRSetting('manualRollsUsers')?.[game.user.id]) return false;
        let manualRollsInclusion = genericUtils.getCPRSetting('manualRollsInclusion');
        if (manualRollsInclusion === 0) return false;
        if ((Object.keys(this.roll.data).length === 0) && !genericUtils.getCPRSetting('manualRollsPromptNoData')) return false;
        if (manualRollsInclusion === 2 && this.roll.data?.actorType === 'character') return true;
        else if (manualRollsInclusion === 3 && fromUuidSync(this.roll.data?.actorUuid)?.prototypeToken?.actorLink === true) return true;
        else if (manualRollsInclusion === 4 && fromUuidSync(this.roll.data?.actorUuid)?.prototypeToken?.actorLink === true && genericUtils.checkPlayerOwnership(fromUuidSync(this.roll.data?.actorUuid)) === true) return true;
        else if (manualRollsInclusion === 5 && genericUtils.checkPlayerOwnership(fromUuidSync(this.roll.data?.actorUuid)) === true) return true;
        else return false;
    }
    async digitalRoll() {
        await this.constructor._fulfillRoll.call(this);
        Roll.defaultImplementation.RESOLVERS.delete(this.roll);
        this.#resolve?.();
    }
    /**
     * Register a fulfilled die roll.
     * @param {string} method        The method used for fulfillment.
     * @param {string} denomination  The denomination of the fulfilled die.
     * @param {number} result        The rolled number.
     * @returns {boolean}            Whether the result was consumed.
     */
    registerResult(method, denomination, result) {
        const query = `label[data-denomination="${denomination}"][data-method="${method}"] > input:not(:disabled)`;
        const term = Array.from(this.element.querySelectorAll(query)).find(input => input.value === '');
        if ( !term ) {
            ui.notifications.warn(`${denomination} roll was not needed by the resolver.`);
            return false;
        }
        term.value = `${result}`;
        const submitTerm = term.closest('.form-fields')?.querySelector('button');
        if ( submitTerm ) submitTerm.dispatchEvent(new MouseEvent('click'));
        else this._checkDone();
        return true;
    }
    async close(options={}) {
        // eslint-disable-next-line no-undef
        if ( this.rendered ) await this.constructor._fulfillRoll.call(this, null, null, new FormDataExtended(this.element));
        Roll.defaultImplementation.RESOLVERS.delete(this.roll);
        this.#resolve?.();
        return super.close(options);
    }
    async _prepareContext(_options) {
        const context = {
            formula: this.roll.formula,
            groups: [{
                formula: this.roll.formula,
                value: this.roll.total,
                ids: [], //each term's ids
                icons: [], //each term's icon
                max: undefined
            }],
            options: {
                advantageMode: this.roll.options.advantageMode,
                name: this.roll.data.name,
                flavor: this.roll.options.flavor ?? this.roll.data.item.name,
                bonusTotal: this.roll.terms.reduce((acc, cur) => {
                    if (cur instanceof CONFIG.Dice.termTypes.NumericTerm) acc += cur.number;
                }, 0)
            },
            buttons: [{type: 'submit', label: 'CHRISPREMADES.Generic.Submit', name: 'confirm', icon: 'fa-solid fa-check'}]
        };
        if (this.roll.options?.flavor?.toLowerCase()?.includes('attack')) context.quickButtons = [
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Fumble', name: 'attack-fumble', icon: 'fa-solid fa-skull-crossbones'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Miss', name: 'attack-miss', icon: 'fa-solid fa-xmark'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Hit', name: 'attack-hit', icon: 'fa-solid fa-check'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Critical', name: 'attack-critical', icon: 'fa-solid fa-check-double'}
        ];
        else if (this.roll.options?.flavor?.toLowerCase()?.includes('sav')) context.quickButtons = [
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Failure', name: 'save-failure', icon: 'fa-solid fa-thumbs-down'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Success', name: 'save-success', icon: 'fa-solid fa-thumbs-up'}
        ];
        for (const fulfillable of this.fulfillable.values()) {
            const {id, term} = fulfillable;
            fulfillable.isNew = false;
            context.groups[0].ids.push(id);
            context.groups[0].icons.push(CONFIG.Dice.fulfillment.dice[term.denomination]?.icon);
            context.groups[0].max = (context.groups[0].max ?? context.options.bonusTotal) + term.denomination;
        }
        return context;
    }
    async _onSubmitForm(formConfig, event) {
        this._toggleSubmission(false);
        await super._onSubmitForm(formConfig, event);
        this.element?.querySelectorAll('input').forEach(input => input.disabled = true);
        this.#resolve();
    }
    /**
     * Handle prompting for a single extra result from a term.
     * @param {DiceTerm} term  The term.
     * @param {string} method  The method used to obtain the result.
     * @param {object} [options]
     * @returns {Promise<number|void>}
     */
    async resolveResult(term, method, { reroll=false, explode=false }={}) {
        const group = this.element.querySelector(`fieldset[data-term-id="${term._id}"]`);
        if ( !group ) {
            console.warn('Attempted to resolve a single result for an unregistered DiceTerm.');
            return;
        }
        const fields = document.createElement('div');
        fields.classList.add('form-fields');
        fields.innerHTML = `
    <label class="icon die-input new-addition" data-denomination="${term.denomination}" data-method="${method}">
        <input type="number" min="1" max="${term.faces}" step="1" name="${term._id}"
                ${method === 'chrispremades' ? '' : 'readonly'} placeholder="${game.i18n.localize(term.denomination)}">
        ${reroll ? '<i class="fas fa-arrow-rotate-right"></i>' : ''}
        ${explode ? '<i class="fas fa-burst"></i>' : ''}
        ${CONFIG.Dice.fulfillment.dice[term.denomination]?.icon ?? ''}
    </label>
    <button type="button" class="submit-result" data-tooltip="DICE.SubmitRoll"
            aria-label="${game.i18n.localize('DICE.SubmitRoll')}">
        <i class="fas fa-arrow-right"></i>
    </button>
    `;
        group.appendChild(fields);
        this.setPosition({ height: 'auto' });
        return new Promise(resolve => {
            const button = fields.querySelector('button');
            const input = fields.querySelector('input');
            button.addEventListener('click', () => {
                if ( !input.validity.valid ) {
                    input.form.reportValidity();
                    return;
                }
                let value = input.valueAsNumber;
                if ( !value ) value = term.randomFace();
                input.value = `${value}`;
                input.disabled = true;
                button.remove();
                resolve(value);
            });
        });
    }
    static async _fulfillRoll(event, form, formData) {
        if (!event?.submitter?.name || event.submitter.name === 'confirm') {
            if (!formData || !formData.object?.total) { // For fulfilling non-rolled terms
                this.fulfillable.forEach(({term}) => {
                    for (let i = term.results.length; i != term.number; i++) {
                        const roll = { result: term.randomFace(), active: true};
                        term.results.push(roll);
                    }
                });
            } else {
                let total = formData.object.total;
                let dice = (this.roll.terms.reduce((dice, die) => {
                    if (die instanceof CONFIG.Dice.termTypes.DiceTerm) {
                        let dieAmount = (die.options.advantage || die.options.disadvantage) ? 1 : die.number;
                        dice.max += (die.faces * dieAmount);
                        for (let i = 0; i < dieAmount; i++) {
                            dice.terms.push(die.faces);
                        }   
                    } else if (die instanceof CONFIG.Dice.termTypes.OperatorTerm) {
                        dice.multiplier = die.operator === '-' ? -1 : 1;
                    } else if (die instanceof CONFIG.Dice.termTypes.NumericTerm) {
                        total -= (die.number * dice.multiplier);
                    }
                    return dice;
                }, {terms: [], max: 0, multiplier: 1})).terms;
                dice.sort((a, b) => a > b ? 1 : -1);
                let results = (dice.reduce((results, number) => {
                    results.diceLeft -= 1;
                    if (number + results.diceLeft <= total) {
                        results.diceArray.push({faces: number, result: number});
                        total -= number;
                    } else if (1 + results.diceLeft >= total) {
                        results.diceArray.push({faces: number, result: 1});
                        total -= 1;
                    } else {
                        results.diceArray.push({faces: number, result: total - results.diceLeft});
                        total -= results.diceLeft;
                    }
                    return results;
                }, {diceLeft: dice.length, diceArray: []})).diceArray;
                for ( let [rollId, total] of Object.entries(formData.object) ) {
                    this.fulfillable.forEach(({term}) => {
                        let index = results.findIndex(i => i.faces === term.faces);
                        let result = results[index].result;
                        for (let i = term.results.length; i != term.number; i++) {
                            const roll = { result: result, active: true };
                            term.results.push(roll);
                        }
                        results.splice(index, 1);
                    });
                }
            }
        } else {
            switch (event.submitter.name) {
                case 'save-failure':
                case 'attack-fumble':
                    this.setAllDiceTerms('min');
                    break;
                case 'save-success':
                case 'attack-critical':
                    this.setAllDiceTerms('max');
                    break;
                case 'attack-miss':
                    this.fulfillable.forEach(({term}) => {
                        for (let i = term.results.length; i != term.number; i++) {
                            const roll = { result: term.faces === 20 ? this.roll.options.fumble + 1 : 1, active: true};
                            term.results.push(roll);
                        }
                    });
                    break;
                case 'attack-hit':
                    this.fulfillable.forEach(({term}) => {
                        for (let i = term.results.length; i != term.number; i++) {
                            const roll = { result: term.faces === 20 ? this.roll.options.targetValue : 1, active: true};
                            term.results.push(roll);
                        }
                    });
                    break;
            }
        }
    }
    setAllDiceTerms(number) {
        this.fulfillable.forEach(({term}) => {
            for (let i = term.results.length; i != term.number; i++) {
                const roll = { result: number === 'min' ? 1 : number === 'max' ? term.faces : number, active: true};
                term.results.push(roll);
            }
        });
    }
    /**
     * Identify any of the given terms which should be fulfilled externally.
     * @param {RollTerm[]} terms               The terms.
     * @param {object} [options]
     * @param {boolean} [options.isNew=false]  Whether this term is a new addition to the already-rendered RollResolver.
     * @returns {Promise<DiceTerm[]>}
     */
    async #identifyFulfillableTerms(terms, { isNew=false }={}) {
        const config = game.settings.get('core', 'diceConfiguration');
        const fulfillable = Roll.defaultImplementation.identifyFulfillableTerms(terms);
        fulfillable.forEach(term => {
            if ( term._id ) return;
            const method = config[term.denomination] || CONFIG.Dice.fulfillment.defaultMethod;
            const id = foundry.utils.randomID();
            term._id = id;
            term.method = method;
            this.fulfillable.set(id, { id, term, method, isNew });
        });
        return fulfillable;
    }
    /**
     * Add a new term to the resolver.
     * @param {DiceTerm} term    The term.
     * @returns {Promise<void>}  Returns a Promise that resolves when the term's results have been externally fulfilled.
     */
    async addTerm(term) {
        if ( !(term instanceof foundry.dice.terms.DiceTerm) ) {
            throw new Error('Only DiceTerm instances may be added to the RollResolver.');
        }
        const fulfillable = await this.#identifyFulfillableTerms([term], { isNew: true });
        if ( !fulfillable.length ) return;
        this.render({ force: true, position: { height: 'auto' } });
        return new Promise(resolve => this.#resolve = resolve);
    }
    _checkDone() {
        // If the form has already in the submission state, we don't need to re-submit.
        const submitter = this.element.querySelector('button[type="submit"]');
        if ( submitter.disabled ) return;

        // If there are any manual inputs, or if there are any empty inputs, then fulfillment is not done.
        if ( this.element.querySelector('input:not([readonly], :disabled)') ) return;
        for ( const input of this.element.querySelectorAll('input[readonly]:not(:disabled)') ) {
            if ( input.value === '' ) return;
        }
        this.element.requestSubmit(submitter);
    }
    _toggleSubmission(enabled) {
        const submit = this.element.querySelector('button[type="submit"]');
        const icon = submit.querySelector('i');
        icon.className = `fas ${enabled ? 'fa-check' : 'fa-spinner fa-pulse'}`;
        submit.disabled = !enabled;
    }
}