import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {psionicPower} from './psionicPower.js';
async function attack({trigger, workflow}) {
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
    let soulBlades = itemUtils.getItemByIdentifier(workflow.actor, 'soulBlades');
    if (!soulBlades) return;
    let psionicPower = itemUtils.getItemByIdentifier(workflow.actor, 'psionicPower');
    if (!psionicPower?.system?.uses?.value) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let subclassIdentifier = itemUtils.getConfig(workflow.item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier');
    let scale = workflow.actor.system.scale[subclassIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let activity = activityUtils.getActivityByIdentifier(soulBlades, 'homingStrikes');
    let selection = await dialogUtils.confirm(activity.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: activity.name + ' (1' + scale.die + ')', attackTotal: workflow.attackTotal}));
    if (!selection) return;
    await workflowUtils.bonusAttack(workflow, '1' + scale.die);
    genericUtils.setProperty(workflow, 'chris-premades.soulBlades.used', true);
    await workflowUtils.syntheticActivityRoll(activity, []);
}
async function range({trigger, workflow}) {
    if (!workflow.targets.size) return;
    if (itemUtils.getItemByIdentifier(workflow.actor, 'sharpshooter')) return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.targets.first());
    if (distance <= 60) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + genericUtils.translate('CHRISPREMADES.Generic.Range'));
}
async function early({trigger, workflow}) {
    if (workflow.actor.system.abilities.str.mod <= workflow.actor.system.abilities.dex.mod) return;
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    itemData.system.activities[workflow.activity.id].attack.ability = 'str';
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function use({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'psychicBladesEffect');
    if (!effect) {
        let identifier = activityUtils.getIdentifier(workflow.activity);
        if (['melee', 'ranged'].includes(identifier)) {
            let effectData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                duration: {
                    turns: 1,
                    seconds: 1
                }
            };
            let bonusMelee = activityUtils.getActivityByIdentifier(workflow.item, 'bonusMelee');
            let bonusRanged = activityUtils.getActivityByIdentifier(workflow.item, 'bonusRanged');
            if (!bonusMelee || !bonusRanged) return;
            await effectUtils.createEffect(workflow.actor, effectData, {
                identifier: 'psychicBladesEffect',
                vae: [
                    {
                        type: 'use',
                        name: bonusMelee.name,
                        identifier: 'psychicBlades',
                        activityIdentifier: 'bonusMelee'
                    },
                    {
                        type: 'use',
                        name: bonusRanged.name,
                        identifier: 'psychicBlades',
                        activityIdentifier: 'bonusRanged'
                    }
                ],
                unhideActivities: [
                    {
                        itemUuid: workflow.item.uuid,
                        activityIdentifiers: ['bonusMelee', 'bonusRanged']
                    }
                ],
                rules: 'modern'
            });
        }
    }
    if (!workflow['chris-premades']?.soulBlades?.used) return;
    let psionicPower = itemUtils.getItemByIdentifier(workflow.actor, 'psionicPower');
    if (!psionicPower || !workflow.hitTargets.size) return;
    await genericUtils.update(psionicPower, {'system.uses.spent': psionicPower.system.uses.spent + 1});
}
export let psychicBlades = {
    name: 'Psychic Blades',
    version: '1.3.58',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 200
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: range,
                priority: 55,
                activities: ['ranged', 'bonusRanged']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    item: psionicPower.item,
    config: psionicPower.config,
    scales: psionicPower.scales
};