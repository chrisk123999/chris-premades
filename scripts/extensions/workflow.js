import {midiEvents} from '../events/midi.js';
function getDamageType(flavorString) {
    if (flavorString === '') return 'none';
    if (game.system.config.damageTypes[flavorString] !== undefined) {
        return flavorString;
    }
    if (game.system.config.healingTypes[flavorString] !== undefined) {
        return flavorString;
    }
    let validDamageTypes = Object.entries(game.system.config.damageTypes).map(e => { e[1] = e[1].label.toLowerCase(); return e; }).deepFlatten().concat(Object.entries(game.system.config.healingTypes).deepFlatten());
    let validHealingTypes = Object.entries(game.system.config.healingTypes).map(e => { e[1] = e[1].label.toLowerCase(); return e; }).deepFlatten();
    let validDamagingTypes = validDamageTypes.concat(validHealingTypes);
    let allDamagingTypeEntries = Object.entries(game.system.config.damageTypes).concat(Object.entries(game.system.config.healingTypes));
    if (validDamagingTypes.includes(flavorString?.toLowerCase()) || validDamageTypes.includes(flavorString)) {
        let damageEntry = allDamagingTypeEntries?.find(e => e[1].label.toLowerCase() === flavorString.toLowerCase());
        return damageEntry ? damageEntry[0] : flavorString;
    }
    return undefined;
}
function createDamageDetail({roll, item, versatile, defaultType, ammo}) {
    let damageParts = {};
    let rolls = roll;
    let DamageRoll = CONFIG.Dice.DamageRoll;
    if (rolls instanceof DamageRoll) {
        rolls = [rolls];
    }
    if (foundry.utils.isNewerVersion(game.system.version, '3.1.99')) {
        let aggregatedRolls = game.system.dice.aggregateDamageRolls(rolls);
        let  detail = aggregatedRolls.map(roll => ({damage: roll.total, type: roll.options.type, formula: roll.formula, properties: new Set(roll.options.properties ?? [])}));
        return detail;
    }
    if (item?.system.damage?.parts[0]) {
        defaultType = item.system.damage.parts[0][1];
    }
    if (rolls instanceof Array) {
        for (let r of rolls) {
            if (!r.options.type) r.options.type = defaultType;
            let rr = r;
            if (rr.terms?.length) for (let i = rr.terms.length - 1; i >= 0;) {
                let term = rr.terms[i--];
                // eslint-disable-next-line no-undef
                if (!(term instanceof NumericTerm) && !(term instanceof DiceTerm) && !(term instanceof ParentheticalTerm)) continue;
                let flavorType = getDamageType(term.flavor);
                let type = (term.flavor !== '') ? flavorType : rr.options.type;
                if (!type || type === 'none') type = r.options.type ?? defaultType;
                let multiplier = 1;
                let operator = rr.terms[i];
                // eslint-disable-next-line no-undef
                while (operator instanceof OperatorTerm) {
                    if (operator.operator === '*') multiplier *= 2;
                    if (operator.operator === '-') multiplier *= -1;
                    operator = rolls.entries[i--];
                }
                let value = Number((term?.total ?? '0')) * multiplier;
                damageParts[type] = value + (damageParts[type] ?? 0);
            }
        }
    }
    let damageDetail = Object.entries(damageParts).map(([type, damage]) => { return { damage, type }; });
    return damageDetail;
}
function setup() {
    class CPRWorkflow extends MidiQOL.workflowClass {
        async WorkflowState_NoAction(context = {}) {
            let nextState = await super.WorkflowState_NoAction(context);
            let abort = await midiEvents.preItemRoll(this);
            if (abort) return this.WorkflowState_Abort;
            return nextState;
        }
        async WorkflowState_PreambleComplete(context = {}) {
            let nextState = await super.WorkflowState_PreambleComplete(context);
            await midiEvents.preambleComplete(this);
            return nextState;
        }
        async WorkflowState_AttackRollComplete(context = {}) {
            let nextState = await super.WorkflowState_AttackRollComplete(context);
            await midiEvents.attackRollComplete(this);
            return nextState;
        }
        async WorkflowState_DamageRollComplete(context = {}) {
            let nextState = await super.WorkflowState_DamageRollComplete(context);
            await midiEvents.damageRollComplete(this);
            await this.displayDamageRolls(game.settings.get('midi-qol', 'ConfigSettings'));
            this.damageDetail = createDamageDetail({roll: this.damageRolls, item: this.item, ammo: this.ammo, versatile: this.rollOptions.versatile, defaultType: this.defaultDamageType});
            return nextState;
        }
        async WorkflowState_RollFinished(context = {}) {
            let nextState = await super.WorkflowState_RollFinished;
            await midiEvents.rollFinished(this);
            return nextState;
        }
        async WorkflowState_WaitForAttackRoll(context = {}) {
            let nextState = await super.WorkflowState_WaitForAttackRoll(context);
            if (nextState === this.WorkflowState_AttackRollComplete) await midiEvents.postAttackRoll(this);
            return nextState;
        }
    }
    MidiQOL.workflowClass = CPRWorkflow;
}
export let workflow = {
    setup
};