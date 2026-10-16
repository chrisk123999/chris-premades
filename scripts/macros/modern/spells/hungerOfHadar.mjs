import {actorUtils, dialogUtils, documentUtils, effectUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
const damageActivities = {'hunger-of-hadar-cold': 'cold', 'hunger-of-hadar-tentacles': 'acid'};
async function cast({workflow}) {
    if (damageActivities[workflow.activity.identifier] || workflowUtils.getCastLevel(workflow) <= 3) return;
    const concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!concentration) return;
    const selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.HungerOfHadar.Upcast', ['cold', 'acid'].map(type => [CONFIG.DND5E.damageTypes[type].label, type]), {userId: queryUtils.firstOwner(workflow.actor, true)});
    await documentUtils.setFlag(concentration, 'chris-premades', 'hungerOfHadar', selection || 'cold');
}
function capUpcast({activity, config}) {
    const type = damageActivities[activity.identifier];
    if (!type) return;
    const concentration = effectUtils.getConcentrationEffect(activity.actor, activity.item);
    const buffed = concentration?.flags['chris-premades']?.hungerOfHadar;
    if (buffed !== type) config.spell = {...config.spell, slot: actorUtils.getEquivalentSpellSlotName(activity.actor, 3) ?? 'spell3'};
}
export const hungerOfHadar = {
    name: 'Hunger of Hadar',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {pass: 'itemPreTargeting', macro: capUpcast, priority: 50},
        {pass: 'itemRollFinished', macro: cast, priority: 50}
    ]
};
