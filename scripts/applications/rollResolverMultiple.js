let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils} from '../utils.js';
export class CPRMultipleRollResolver extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(rolls, options={}) {
        console.log('hello there');
        super(options);
        this.#rolls = Array.isArray(rolls) ? rolls : [rolls];
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
            handler: CPRMultipleRollResolver._fulfillRoll
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/roll-resolver-multiple-form.hbs'
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
    get rolls() {
        return this.#rolls;
    }
    #rolls;
    async awaitFulfillment() {
        console.log('await fulfillment');
        console.log(this.rolls);
        const fulfillable = await this.#identifyFulfillableTerms(this.rolls); //
        if ( !fulfillable.length ) return;
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.set(roll, this)); //
        let promise = new Promise(resolve => this.#resolve = resolve);
        if (this.checkPreferences()) this.render(true);
        else await this.digitalRoll();
        return promise;
    }
    checkPreferences() {
        if (!(this.rolls.some(roll => roll instanceof CONFIG.Dice.DamageRoll))) return false; //
        if (genericUtils.getCPRSetting('manualRollsPreferences')?.[game.user.id]) return true;
        else return false;
    }
    async digitalRoll() {
        await this.constructor._fulfillRoll.call(this);
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.delete(roll)); //
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
        console.log('register result');
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
        console.log('close');
        // eslint-disable-next-line no-undef
        if ( this.rendered ) await this.constructor._fulfillRoll.call(this, null, null, new FormDataExtended(this.element));
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.delete(roll)); //
        this.#resolve?.();
        return super.close(options);
    }
    async _prepareContext(_options) {
        console.log(this);
        console.log('prepare context');
        const context = {
            groups: [],
            options: {
                name: this.rolls[0].data.name,
                itemName: this.rolls[0].data.item.name,
            },
            buttons: [{type: 'submit', action: 'confirm', label: 'CHRISPREMADES.Generic.Submit', name: 'confirm', icon: 'fa-solid fa-check'}]
        };
        this.rolls.forEach(roll => {
            let damageType = roll.options.type ?? roll.options.flavor ?? 'none';
            let group = context.groups.find(g => g.damageType === damageType);
            if (!group) context.groups.push(group = {
                damageType: damageType,
                formula: '',
                ids: [],
                icons: [],
                max: 0,
                bonusTotal: 0
            });
            roll.terms.forEach(term => {
                if (term instanceof CONFIG.Dice.termTypes.DiceTerm && term.number && term.faces) {
                    group.max += term.faces;
                    group.formula += group.formula.length ? (' + ' + term.expression) : term.expression;
                    group.icons += CONFIG.Dice.fulfillment.dice[term.denomination]?.icon;
                } else if (term instanceof CONFIG.Dice.termTypes.NumericTerm && term.number) {
                    group.max += term.number;
                    group.bonusTotal += term.number;
                }
            });
        });
        console.log(genericUtils.duplicate(context));
        for (const fulfillable of this.fulfillable.values()) {
            const {id, term, damageType} = fulfillable;
            context.groups.find(g => g.damageType === damageType).ids.push(id);
            fulfillable.isNew = false;
            console.log(term);
        }
        console.log(context);
        return context;
    }
    async _onSubmitForm(formConfig, event) {
        console.log('on submit form');
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
        console.log('resolve result', term, method, this);
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
        console.log('fulfill roll', formData?.object, event, form);
        console.log(event?.submitter?.name);
        if (!event?.submitter?.name || event?.submittter?.name === 'confirm') {
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
                        dice.max += (die.faces * die.number);
                        for (let i = 0; i < die.number; i++) {
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
    async #identifyFulfillableTerms(rolls, { isNew=false }={}) { // updated
        console.log('identify fulfillable terms');
        const config = game.settings.get('core', 'diceConfiguration');
        const fulfillable = rolls.map(roll => {
            let terms = [];
            roll.terms.forEach(term => {
                if ((term instanceof CONFIG.Dice.termTypes.DiceTerm) && term.number && term.faces && !term._id) {
                    terms.push(term);
                    const method = config[term.denomination] || CONFIG.Dice.fulfillment.defaultMethod;
                    const id = foundry.utils.randomID();
                    term._id = id;
                    term.method = method;
                    const damageType = roll.options.type ?? roll.options.flavor;
                    this.fulfillable.set(id, { id, term, method, isNew, damageType });
                }
            });
            return terms;
        });
        return fulfillable;
    }
    /**
     * Add a new term to the resolver.
     * @param {DiceTerm} term    The term.
     * @returns {Promise<void>}  Returns a Promise that resolves when the term's results have been externally fulfilled.
     */
    async addTerm(term) { // Do I need this???
        console.log('add term');
        if ( !(term instanceof foundry.dice.terms.DiceTerm) ) {
            throw new Error('Only DiceTerm instances may be added to the RollResolver.');
        }
        const fulfillable = await this.#identifyFulfillableTerms([term], { isNew: true });
        if ( !fulfillable.length ) return;
        this.render({ force: true, position: { height: 'auto' } });
        return new Promise(resolve => this.#resolve = resolve);
    }
    _checkDone() {
        console.log('check done');
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