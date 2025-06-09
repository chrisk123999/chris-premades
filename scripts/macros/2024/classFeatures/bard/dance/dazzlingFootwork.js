import {actorUtils, genericUtils, activityUtils, itemUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function skill({trigger: {skillId, actor}}) {
    if (skillId !== 'prf') return;
    if (actorUtils.getEquippedArmor(actor) || actorUtils.getEquippedShield(actor)) return;
    return {label: 'CHRISPREMADES.Macros.DazzlingFootwork.DanceVirtuoso', type: 'advantage'};
}
async function early({trigger: {entity: item}, workflow}) {
    if (!workflow.item) return;
    if (actorUtils.getEquippedArmor(workflow.actor) || actorUtils.getEquippedShield(workflow.actor)) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'unarmedStrike') return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier != 'punch') return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    workflow.item = workflow.item.clone({'system.damage.base.bonus': `@scale.${classIdentifier}.${scaleIdentifier}.die + @abilities.dex.mod`, 'system.properties': Array.from(workflow.item.system.properties).concat('fin')}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.applyActiveEffects();
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function updateScales(origItem, newItemData) {
    let { scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, bardicInspiration.scaleAliases, 'bard');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'flags.chris-premades.config.scaleIdentifier', scaleIdentifier);
}
export let dazzlingFootwork = {
    name: 'Dazzling Footwork',
    version: '1.1.36',
    rules: 'modern',
    early: updateScales,
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
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: bardicInspiration.scales
};