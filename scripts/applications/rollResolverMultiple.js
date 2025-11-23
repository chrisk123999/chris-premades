let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils} from '../utils.js';
export class CPRMultipleRollResolver extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(rolls, options={}) {
        super(options);
        genericUtils.log('dev', 'Constructing Multiple Roll Resolver');
        this.#rolls = Array.isArray(rolls) ? rolls : [rolls];
    }
    static DEFAULT_OPTIONS = {
        id: 'roll-resolver-{id}',
        tag: 'form',
        window: {
            title: 'DICE.RollResolution',
            contentClasses: ['standard-form']
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
        genericUtils.log('dev', 'Awaiting fulfillment of Multiple Roll Resolver');
        const fulfillable = await this.#identifyFulfillableTerms(this.rolls);
        if (!fulfillable.length) return;
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.set(roll, this));
        let promise = new Promise(resolve => this.#resolve = resolve);
        this.render(true);
        return promise;
    }
    async digitalRoll() {
        await this.constructor._fulfillRoll.call(this);
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.delete(roll));
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
        if ( this.rendered ) await this.constructor._fulfillRoll.call(this, null, null, new foundry.applications.ux.FormDataExtended(this.element));
        this.rolls.forEach(roll => Roll.defaultImplementation.RESOLVERS.delete(roll)); //
        this.#resolve?.();
        return super.close(options);
    }
    async _prepareContext(_options) {
        const diceOnly = genericUtils.getCPRSetting('manualRollsInputDiceOnly');
        const placeholderKey = diceOnly ? 'CHRISPREMADES.Generic.DiceOnly' : 'CHRISPREMADES.Generic.Total';
        const context = {
            groups: [],
            options: {
                name: this.rolls[0]?.data?.name,
                itemName: this.rolls[0].data?.item?.name
            },
            buttons: [{type: 'submit', action: 'confirm', label: 'CHRISPREMADES.Generic.Submit', name: 'confirm', icon: 'fa-solid fa-check'}],
            placeholder: genericUtils.translate(placeholderKey) //placeholder text depending on 'manualRollsInputDiceOnly' setting
        };
        this.rolls.forEach(roll => {
            let damageType = roll.options.type ?? roll.options.flavor ?? 'none';
            let group = context.groups.find(g => g.damageType === damageType);
            if (!group) context.groups.push(group = {
                damageType: damageType,
                damageTypeLabel: CONFIG.DND5E.damageTypes[damageType]?.label ?? CONFIG.DND5E.healingTypes[damageType]?.label ?? damageType,
                formula: '',
                ids: [],
                icon: CONFIG.DND5E.damageTypes[damageType]?.icon ?? CONFIG.DND5E.healingTypes[damageType]?.icon,
                max: 0,
                bonusTotal: 0
            });
            roll.terms.forEach(term => {
                if (term instanceof CONFIG.Dice.termTypes.DiceTerm && term.number && term.faces) {
                    group.max += term.faces * term.number;
                    group.formula += group.formula.length ? (' + ' + term.expression) : term.expression;
                } else if (term instanceof CONFIG.Dice.termTypes.NumericTerm && term.number) {
                    group.max += term.number;
                    group.bonusTotal += term.number;
                }
            });
        });
        context.groups.forEach(group => group.formula += group.bonusTotal === 0 ? '' : group.formula.length ? (' + ' + group.bonusTotal) : group.bonusTotal);
        for (const fulfillable of this.fulfillable.values()) {
            const {id, term, damageType} = fulfillable;
            context.groups.find(g => g.damageType === damageType).ids.push(id);
            fulfillable.isNew = false;
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
    async resolveResult(term, method, { reroll=false, explode=false }={}) { // Needed???
        genericUtils.log('dev', 'Multiple roll resolver resolveResult has been called!');
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
        if (!formData || (Object?.values(formData?.object).some(i => i === ''))) { // For fulfilling non-rolled terms, if any are left blank, just roll them all for simplicity.
            this.fulfillable.forEach(({term}) => {
                for (let i = term.results.length; i != term.number; i++) {
                    const roll = { result: term.randomFace(), active: true};
                    term.results.push(roll);
                }
            });
        } else {
            Object.entries(formData.object).forEach(([resultDamageType, total]) => {
                let originalTotal = genericUtils.duplicate(total);
                let dice = (this.rolls.filter(roll => resultDamageType === (roll.options.type ?? roll.options.flavor)).reduce((dice, roll) => {
                    roll.terms.forEach(die => {
                        if (die instanceof CONFIG.Dice.termTypes.DiceTerm) {
                            for (let i = 0; i < die.number; i++) {
                                dice.terms.push(die.faces);
                            }
                        } else if (die instanceof CONFIG.Dice.termTypes.OperatorTerm) {
                            dice.multiplier = die.operator === '-' ? -1 : 1;
                        } else if (die instanceof CONFIG.Dice.termTypes.NumericTerm) {
                            if (!genericUtils.getCPRSetting('manualRollsInputDiceOnly')) {
                                total -= (die.number * dice.multiplier);
                            }
                        }
                    });
                    return dice;
                }, {terms: [], multiplier: 1})).terms;
                let results;
                if ((originalTotal instanceof String || typeof originalTotal === 'string') && originalTotal.includes(',')) { // If we were given a comma seperated list, assume it's in order and map it against the dice
                    let diceResults = originalTotal.split(/[\s,]+/).map(Number);
                    results = diceResults.map((i, index) => ({faces: dice[index], result: i}));
                } else results = (dice.reduce((results, number) => {
                    results.diceLeft -= 1; // Remove one from the total left, since we're determining that one now.
                    if (number + results.diceLeft <= total) {
                        // If the die we're on plus the amount of dice we have left is less than what we have to work with, make the die it's max value
                        // ie total is 10, we have 2 dice left, our current number is a 6, we have at least enough to make this 6 and max and the others at least 1.
                        genericUtils.log('dev', 'Roll Resolver Multiple - max amount for d' + number);
                        results.diceArray.push({faces: number, result: number});
                        total -= number;
                    } else if (1 + results.diceLeft >= total) {
                        // If we don't have enough left to make the die anything but 1, make it 1.
                        genericUtils.log('dev', 'Roll Resolver Multiple - min amount for d' + number);
                        results.diceArray.push({faces: number, result: 1});
                        total -= 1;
                    } else {
                        // If we don't have enough to make the dice it's max, but it's more than the minimum left, make the dice as big as it can be and let the rest be 1's
                        results.diceArray.push({faces: number, result: total - results.diceLeft});
                        genericUtils.log('dev', 'Roll Resolver Multiple - middle amount for d' + number);
                        total = results.diceLeft;
                    }
                    return results;
                }, {diceLeft: dice.length, diceArray: []})).diceArray;
                this.fulfillable.forEach(({term, damageType}) => {
                    if (damageType === resultDamageType) {
                        for (let i = term.results.length; i != term.number; i++) {
                            let index = results.findIndex(j => j.faces === term.faces);
                            let result = results[index].result;
                            const roll = { result: result, active: true };
                            term.results.push(roll);
                            results.splice(index, 1);
                        }
                    }
                });
            });
        }
        this.rolls.forEach(roll => {
            roll.terms.forEach(term => term._evaluated = true);
            roll._evaluated = true;
        });
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
    async #identifyFulfillableTerms(rolls, { isNew=false }={}) {
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
