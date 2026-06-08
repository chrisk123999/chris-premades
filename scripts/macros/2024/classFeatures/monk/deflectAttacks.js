import {socket, sockets} from '../../../../lib/sockets.js';
import {activityUtils, actorUtils, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function damageApplication({trigger: {entity: item}, workflow, ditem}) {
    if (ditem.newHP === ditem.oldHP || !ditem.isHit) return;
    if (actorUtils.hasUsedReaction(item.actor)) return;
    let deflectEnergy = itemUtils.getItemByIdentifier(item.actor, 'deflectEnergy');
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!deflectEnergy) {
        damageTypes = new Set(['bludgeoning', 'piercing', 'slashing']).intersection(damageTypes);
        if (!damageTypes.size) return;
    }
    let userId = socketUtils.firstOwner(item.actor, true);
    let selection = await dialogUtils.confirmUseItem(item, {userId});
    if (!selection) return;
    let reduceActivity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!reduceActivity) return;
    let targetWorkflow = await socket.executeAsUser(sockets.syntheticActivityDataRoll.name, userId, reduceActivity.toObject(), item.uuid, [workflow.hitTargets.first().document.uuid]);
    let reduction = targetWorkflow.utilityRolls[0].total;
    let originalDetail = genericUtils.deepClone(ditem.damageDetail);
    for (let dmg of originalDetail) {
        let multiplier = dmg.active.multiplier;
        if (dmg.active.immunity || multiplier === 0) continue;
        if (!damageTypes.has(dmg.type)) continue;
        let distributedReduction = Math.min(dmg.damage, reduction);
        workflowUtils.modifyDamageAppliedFlat(ditem, -Math.ceil(distributedReduction * multiplier), {type: dmg.type, multiplier});
        reduction -= distributedReduction;
        if (reduction <= 0) break;
    }
    if (ditem.newHP != ditem.oldHP) return;
    let monksFocus = itemUtils.getItemByIdentifier(item.actor, 'monksFocus');
    if (!monksFocus?.system?.uses?.value) return;
    let range = workflowUtils.isAttackType(workflow, 'meleeAttack') ? 5 : 60;
    let nearby = tokenUtils.findNearby(workflow.hitTargets.first(), range, 'all', {includeIncapacitated: true});
    if (!nearby.length) return;
    let targetSelection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.DeflectAttacks.UseAndTarget', nearby, {skipDeadAndUnconscious: false, userId, buttons: 'yesNo'});
    if (!targetSelection || !targetSelection[0]) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'save', {strict: true});
    if (!activity) return;
    let activityData = genericUtils.duplicate(activity.toObject());
    activityData.damage.parts[0].types = [workflow.defaultDamageType];
    await socket.executeAsUser(sockets.syntheticActivityDataRoll.name, userId, activityData, item.uuid, [targetSelection[0].document.uuid], {consumeResources: true, consumeUsage: true});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
    await itemUtils.correctActivityItemConsumption(item, ['save'], 'monksFocus');
}
export let deflectAttacks = {
    name: 'Deflect Attacks',
    version: '1.3.141',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 100
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'martial-arts',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'martial-arts',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        1: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        17: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Martial Arts'
            }
        }
        
    ]
};