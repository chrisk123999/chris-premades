import {actorUtils, automationUtils, documentUtils, effectUtils, genericUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
function getEffectId(item, identifier) {
    return item.effects.find(effect => effect.flags.cat?.identifier === identifier)?.id;
}
async function createEffect(actor, item, identifier, {flags, ...options} = {}) {
    const effectData = documentUtils.getEffectData(item, getEffectId(item, identifier), options);
    if (!effectData) return;
    if (flags) genericUtils.mergeObject(effectData, {flags});
    await effectUtils.createEffects(actor, [effectData]);
}
export function isSuffocating(actor) {
    return !!(actorUtils.getEffectByIdentifier(actor, 'suffocationHoldingBreath') || actorUtils.getEffectByIdentifier(actor, 'suffocationOutOfAir'));
}
export async function startHoldingBreath(actor, item, {flags, macros} = {}) {
    if (isSuffocating(actor)) return;
    if (automationUtils.getConfigValue(item, 'startsOutOfAir')) return await createEffect(actor, item, 'suffocationOutOfAir', {flags, macros});
    const seconds = rollUtils.rollDiceSync(automationUtils.getConfigValue(item, 'breathFormula') || holdBreath.config.breathFormula.default, {document: actor}).total;
    await createEffect(actor, item, 'suffocationHoldingBreath', {duration: {value: seconds, units: 'seconds'}, flags, macros});
}
async function use({document: item, workflow}) {
    await startHoldingBreath(workflow.actor, item);
}
async function breathRanOut({document: effect}) {
    if (effect.duration.remaining > 0) return;
    const actor = effectUtils.getActor(effect);
    const item = (await fromUuid(effect.origin))?.parent;
    if (!actor || !item) return;
    const macros = Object.entries(effect.flags.cat?.macros ?? {}).map(([type, list]) => ({type, macros: list.filter(macro => macro.identifier === 'environmentEffect')}));
    await createEffect(actor, item, 'suffocationOutOfAir', {flags: {'chris-premades': effect.flags['chris-premades']}, macros});
}
async function turnEnd({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    if ((actor.system.attributes.exhaustion ?? 0) >= (CONFIG.DND5E.conditionTypes.exhaustion?.levels ?? 6)) return;
    await actorUtils.addExhaustion(actor, 1);
    await documentUtils.setFlag(effect, 'chris-premades', 'suffocationExhaustion', (effect.flags['chris-premades']?.suffocationExhaustion ?? 0) + 1);
}
async function breathe({document: effect}) {
    const actor = effectUtils.getActor(effect);
    const gained = effect.flags['chris-premades']?.suffocationExhaustion;
    if (!actor || !gained) return;
    await documentUtils.update(actor, {'system.attributes.exhaustion': Math.max((actor.system.attributes.exhaustion ?? 0) - gained, 0)});
}
async function turnStart({document: effect, token}) {
    const actor = effectUtils.getActor(effect);
    if (!actor || !token || effect.flags['chris-premades']?.suffocationDropped) return;
    const rounds = (effect.flags['chris-premades']?.suffocationRounds ?? 0) + 1;
    const item = (await fromUuid(effect.origin))?.parent;
    const survival = rollUtils.rollDiceSync(automationUtils.getConfigValue(item, 'survivalFormula') || holdBreathLegacy.config.survivalFormula.default, {document: actor}).total;
    if (rounds <= survival) {
        await documentUtils.setFlag(effect, 'chris-premades', 'suffocationRounds', rounds);
        return;
    }
    await documentUtils.setFlag(effect, 'chris-premades', 'suffocationDropped', true);
    const {value, temp} = actor.system.attributes.hp;
    if (value + (temp ?? 0) > 0) await workflowUtils.applyDamage([token], value + (temp ?? 0), 'none');
    if (!actor.statuses.has('dead') && !actor.statuses.has('unconscious')) await actorUtils.applyConditions(actor, ['unconscious'], {overlay: true});
}
const holdBreath = {
    name: 'Hold Breath',
    version: '2.1.8',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        startsOutOfAir: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.Suffocation.StartsOutOfAir',
            hint: 'CHRISPREMADES.Macros.Modern.Suffocation.StartsOutOfAirHint',
            category: 'mechanics'
        },
        breathFormula: {
            default: 'max((1 + @abilities.con.mod) * 60, 30)',
            type: 'formula',
            deterministic: true,
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.Suffocation.BreathFormula',
            hint: 'CHRISPREMADES.Macros.Modern.Suffocation.BreathFormulaHint'
        }
    }
};
export const holdBreathModern = {
    ...holdBreath,
    rules: '2024'
};
export const holdBreathLegacy = {
    ...holdBreath,
    rules: '2014',
    config: {
        ...holdBreath.config,
        survivalFormula: {
            default: 'max(@abilities.con.mod, 1)',
            type: 'formula',
            deterministic: true,
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.Suffocation.SurvivalFormula',
            hint: 'CHRISPREMADES.Macros.Modern.Suffocation.SurvivalFormulaHint'
        }
    }
};
export const suffocationHoldingBreath = {
    name: 'Suffocation: Holding Breath',
    version: holdBreath.version,
    rules: 'all',
    effect: [
        {
            pass: 'deleted',
            macro: breathRanOut,
            priority: 50
        }
    ]
};
export const suffocationOutOfAir = {
    name: 'Suffocation: Out of Air',
    version: holdBreath.version,
    rules: '2024',
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: breathe,
            priority: 50
        }
    ]
};
export const suffocationOutOfAirLegacy = {
    name: suffocationOutOfAir.name,
    version: holdBreath.version,
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
