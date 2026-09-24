import {dataUtils, workflowUtils} from './proxy.mjs';
function getSpellAttackBonus(item) {
    const actor = item.actor;
    const ability = item.system.ability || actor.system.attributes.spellcasting || 'int';
    const bonus = dnd5e.utils.simplifyBonus(actor.system.bonuses?.rsak?.attack, actor.getRollData());
    return actor.system.attributes.prof + (actor.system.abilities[ability]?.mod ?? 0) + bonus;
}
function addDamageBonus(itemData, bonus) {
    Object.values(itemData.system.activities).forEach(activityData => {
        const part = activityData.damage?.parts?.[0];
        if (!part) return;
        part.bonus = part.bonus ? part.bonus + ' + ' + bonus : String(bonus);
    });
}
function getScaledDuration(workflow) {
    const castDurations = {1: 3600, 2: 3600, 3: 28800, 4: 28800};
    const seconds = castDurations[workflowUtils.getCastLevel(workflow)] ?? 86400;
    return Math.min(seconds * workflow.item.system.duration.value, 86400);
}
function addEffectMacro(effectData, {type, macroIdentifier, rules, effectIdentifier}) {
    return dataUtils.buildEffectData(effectData, {
        macros: [
            {
                type,
                macros: [
                    {
                        source: 'chris-premades',
                        identifier: macroIdentifier,
                        rules,
                        effectIdentifier
                    }
                ]
            }
        ]
    });
}
async function rollConfiguredSource(bonus, config, targets = []) {
    const item = bonus.document.documentName === 'Item' ? bonus.document : bonus.activity?.item;
    if (!item) return;
    if (config.rollItem) return await workflowUtils.completeItemUse(item, targets);
    if (!config.rollActivity) return;
    const activity = item.system.activities.get(config.rollActivity);
    if (activity) await workflowUtils.completeActivityUse(activity, targets, {consumeResources: config.consume, consumeUsage: config.consume});
}
export default {
    addDamageBonus,
    addEffectMacro,
    getScaledDuration,
    getSpellAttackBonus,
    rollConfiguredSource
};
