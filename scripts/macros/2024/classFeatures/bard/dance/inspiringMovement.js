import {activityUtils, actorUtils, combatUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function use({trigger, workflow}) {
    let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
    let dazzlingFootwork = itemUtils.getItemByIdentifier(workflow.actor, 'dazzlingFootwork');
    if (unarmedStrike && dazzlingFootwork && workflow.token && !actorUtils.getEquippedArmor(workflow.actor) && !actorUtils.getEquippedShield(workflow.actor)) {
        let nearbyTargets = tokenUtils.findNearby(workflow.token, unarmedStrike.system.range.reach, 'enemy', {includeIncapacitated: true});
        if (nearbyTargets.length) {
            let selection = await dialogUtils.selectTargetDialog(dazzlingFootwork.name, 'CHRISPREMADES.Macros.DazzlingFootwork.AgileStrikes', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
            if (selection?.[0]) {
                let activity = activityUtils.getActivityByIdentifier(unarmedStrike, 'punch', {strict: true});
                if (activity) {
                    let itemData = genericUtils.duplicate(unarmedStrike.toObject());
                    itemData.system.activities[activity.id].activation.type = 'special';
                    await workflowUtils.syntheticItemRoll(dazzlingFootwork, [workflow.token]);
                    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [selection[0]]);
                }
            }
        }
    }
    if (combatUtils.inCombat()) if (workflow.targets.size) await Promise.all(workflow.targets.map(async token => await actorUtils.setReactionUsed(token.actor)));
}
async function added({trigger: {entity: item, identifier, actor}}) {
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use');
    if (!activity) return;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: [
        {
            type: 'itemUses',
            value: 1,
            target: bardicInspiration.id,
            scaling: {
                mode: undefined,
                formula: undefined
            }
        }
    ]});
}
export let inspiringMovement = {
    name: 'Inspiring Movement',
    version: '1.1.36',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added
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