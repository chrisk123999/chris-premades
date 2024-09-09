import {genericUtils, itemUtils, effectUtils, actorUtils, workflowUtils} from '../../../utils.js';
async function apply({trigger, workflow, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let originItem = trigger.entity;
    let genericConfig = itemUtils.getGenericFeatureConfig(originItem, 'undeadFortitude');
    if (genericConfig.bypassCritical && workflow.isCritical) return;
    let bypassDamageTypes = genericConfig.bypassDamageTypes;
    if (bypassDamageTypes.includes(workflow.defaultDamageType)) return;
    let targetActor = trigger.token.actor;
    let damageDealt = ditem.totalDamage;
    let featureData = genericUtils.duplicate(originItem.toObject());
    featureData.system.actionType = 'save';
    featureData.system.save = {
        ability: 'con',
        dc: damageDealt + 5,
        scaling: 'flat'
    };
    featureData.system.target = {
        type: 'creature'
    };
    featureData.system.save.dc = damageDealt + 5;
    delete featureData._id;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, targetActor, [trigger.token]);
    if (featureWorkflow.failedSaves.size === 1) {
        return;
    }
    workflowUtils.setDamageItemDamage(ditem, ditem.oldHP - 1);
}
export let undeadFortitude = {
    name: 'Undead Fortitude',
    version: '0.12.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: apply,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'bypassDamageTypes',
            label: 'CHRISPREMADES.Macros.UndeadFortitude.DamageTypes',
            type: 'damageTypes',
            default: ['radiant'],
        },
        {
            value: 'bypassCritical',
            label: 'CHRISPREMADES.Macros.UndeadFortitude.Critical',
            type: 'checkbox',
            default: true,
        }
    ]
};