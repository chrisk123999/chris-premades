let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils} from '../utils.js';
export class CPRSingleRollResolver extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, options={}) {
        super(options);
        genericUtils.log('dev', 'Constructing Single Roll Resolver');
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
        genericUtils.log('dev', 'Awaiting fulfillment of Single Roll Resolver');
        const fulfillable = await this.#identifyFulfillableTerms(this.roll.terms);
        if (!fulfillable.length) return;
        Roll.defaultImplementation.RESOLVERS.set(this.roll, this);
        let promise = new Promise(resolve => this.#resolve = resolve);
        if (this.checkPreferences()) this.render(true);
        else await this.digitalRoll();
        return promise;
    }
    checkPreferences() {
        if (this.roll instanceof CONFIG.Dice.DamageRoll) {log('is damage roll'); return false;}
        if (!genericUtils.getCPRSetting('manualRollsUsers')?.[game.user.id]) {log('user does not have manual rolls enabled'); return false;}
        let manualRollsInclusion = genericUtils.getCPRSetting('manualRollsInclusion');
        if (manualRollsInclusion === 0) {log('manual rolls inclusion is 0'); return false;}
        if ((Object.keys(this.roll.data).length === 0) && !genericUtils.getCPRSetting('manualRollsPromptNoData')) {log('roll has no data'); return false;}
        if (manualRollsInclusion === 1) return true;
        if ((manualRollsInclusion === 2) && (this.roll.data?.actorType === 'character')) return true;
        if (genericUtils.getCPRSetting('updateCompanionInitiative') && this.roll?.options?.flavor?.toLowerCase()?.includes('initiative') && (fromUuidSync(this.roll.data?.actorUuid).type === 'npc') && (genericUtils.checkPlayerOwnership(fromUuidSync(this.roll.data?.actorUuid)) === true)) return false;
        if (genericUtils.getCPRSetting('updateSummonInitiative') && this.roll?.options?.flavor?.toLowerCase()?.includes('initiative') && fromUuidSync(this.roll.data?.actorUuid).flags['chris-premades']?.summons?.control?.actor) return false;
        else if ((manualRollsInclusion === 3) && (fromUuidSync(this.roll.data?.actorUuid)?.prototypeToken?.actorLink === true)) return true;
        else if ((manualRollsInclusion === 4) && (fromUuidSync(this.roll.data?.actorUuid)?.prototypeToken?.actorLink === true) && (genericUtils.checkPlayerOwnership(fromUuidSync(this.roll.data?.actorUuid)) === true)) return true;
        else if ((manualRollsInclusion === 5) && (genericUtils.checkPlayerOwnership(fromUuidSync(this.roll.data?.actorUuid)) === true)) return true;
        else return false;
        function log(reason) {
            genericUtils.log('dev', 'Check Preferences: False - ' + reason);
        }
    }
    async digitalRoll() {
        genericUtils.log('dev', 'Fulfilling Digital Roll');
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
    registerResult(method, denomination, result) { // Is this needed???
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
                modifiers: this.roll.terms.reduce((modifiersString, term) => {
                    if (term?.modifiers) term.modifiers.forEach(mod => {
                        modifiersString.length ? modifiersString.concat(', ' + mod) : modifiersString = mod;
                    });
                    return modifiersString;
                }, false),
                name: this.roll.data.name,
                flavor: this.roll.options.type ?? this.roll.data?.item?.name,
                bonusTotal: this.roll.terms.reduce((acc, cur) => {
                    if (cur instanceof CONFIG.Dice.termTypes.NumericTerm) acc += cur.number;
                }, 0)
            },
            buttons: [{type: 'submit', label: 'CHRISPREMADES.Generic.Submit', name: 'confirm', icon: 'fa-solid fa-check'}]
        };
        context.options.content = (!context.options.name || !context.options.type) ? context.formula : context.options.name + ' - ' + context.options.type;
        if (this.roll.options?.type?.toLowerCase()?.includes('attack')) context.quickButtons = [
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Fumble', name: 'attack-fumble', icon: 'fa-solid fa-skull-crossbones'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Miss', name: 'attack-miss', icon: 'fa-solid fa-xmark'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Hit', name: 'attack-hit', icon: 'fa-solid fa-check'},
            {type: 'submit',  label: 'CHRISPREMADES.ManualRolls.Critical', name: 'attack-critical', icon: 'fa-solid fa-check-double'}
        ];
        else if (this.roll.options?.type?.toLowerCase()?.includes('sav')) context.quickButtons = [
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
    async resolveResult(term, method, {reroll = false, explode = false} = {}) {
        if (!this.element) return term.randomFace();
        let rerolledResult = term.results.find(i => i.rerolled === true)?.result;
        if (term.results.filter(i => i.rerolled === true).length >= 10) {
            ui.notifications.error('CPR Roll Resolver | Maximum reroll depth reached, please resolve modified rolls manually before entering total!');
            return term.randomFace();
        }
        if (rerolledResult) {
            return rerolledResult;
        } else {
            console.warn('CPR Roll Resolver | Please share w/ Autumn225 - Term is not a reroll and needs to be resolved', term);
            return term.randomFace();
        }
    }
    static async _fulfillRoll(event, form, formData) {
        if (!event?.submitter?.name || event.submitter.name === 'confirm') {
            if (!formData || !formData?.object?.total) { // For fulfilling non-rolled terms
                this.fulfillable.forEach(({term}) => {
                    for (let i = term.results.length; i < (term.number ?? term._number); i++) {
                        const roll = { result: term.randomFace(), active: true};
                        term.results.push(roll);
                    }
                });
            } else {
                let originalTotal = formData.object.total;
                let total = genericUtils.duplicate(originalTotal);
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
                }, {terms: [], max: 0, multiplier: 1}));
                let results;
                if ((originalTotal instanceof String || typeof originalTotal === 'string') && originalTotal.includes(',')) {
                    let diceResults = originalTotal.split(/[\s,]+/).map(Number);
                    results = diceResults.map((i, index) => ({faces: dice.terms[index], result: i}));
                } else results = (dice.terms.reduce((results, number) => {
                    results.diceLeft -= 1;
                    if (number + results.diceLeft <= total) {
                        let value = ((number === this.roll?.options?.critical) && (total != dice.max)) ? number - 1 : number; 
                        results.diceArray.push({faces: number, result: value});
                        total -= value;
                    } else if (1 + results.diceLeft >= total) {
                        results.diceArray.push({faces: number, result: 1});
                        total -= 1;
                    } else {
                        results.diceArray.push({faces: number, result: total - results.diceLeft}); // 5 - 2 = 3
                        total = results.diceLeft;
                    }
                    return results;
                }, {diceLeft: dice.terms.length, diceArray: []})).diceArray;
                for ( let [rollId, total] of Object.entries(formData.object) ) {
                    this.fulfillable.forEach(({term}) => {
                        for (let i = term.results.length; i != term.number; i++) {
                            let index = results.findIndex(i => i.faces === term.faces);
                            let result = results[index].result;
                            const roll = { result: result, active: true };
                            term.results.push(roll);
                            results.splice(index, 1);
                        }
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
                            const roll = { result: term.faces === 20 ? this.roll.options.criticalFailure + 1 : 1, active: true};
                            term.results.push(roll);
                        }
                    });
                    break;
                case 'attack-hit':
                    this.fulfillable.forEach(({term}) => {
                        for (let i = term.results.length; i != term.number; i++) {
                            const roll = { result: term.faces === 20 ? this.roll.options.target : 1, active: true};
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