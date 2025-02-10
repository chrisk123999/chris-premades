import {actorUtils, genericUtils, activityUtils, itemUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function skill({trigger: {skillId, actor}}) {
    if (skillId !== 'prf') return;
    if (actorUtils.getEquippedArmor(actor) || actorUtils.getEquippedShield(actor)) return;
    return {label: 'CHRISPREMADES.Macros.DazzlingFootwork.DanceVirtuoso', type: 'advantage'};
}
async function early({trigger, workflow}) {
    if (!workflow.item) return;
    if (actorUtils.getEquippedArmor(workflow.actor) || actorUtils.getEquippedShield(workflow.actor)) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'unarmedStrike') return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier != 'punch') return;
    workflow.item = workflow.item.clone({'system.damage.base.bonus': '@scale.bard.bardic-inspiration.die + @abilities.dex.mod', 'system.properties': Array.from(workflow.item.system.properties).concat('fin')}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.applyActiveEffects();
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let dazzlingFootwork = {
    name: 'Dazzling Footwork',
    version: '1.1.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 60
            }
        ]
    },
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ],
    scales: bardicInspiration.scales
};