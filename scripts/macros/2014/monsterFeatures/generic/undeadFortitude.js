import {genericUtils, itemUtils, effectUtils, actorUtils, workflowUtils} from '../../../../utils.js';
async function apply({trigger, workflow, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let originItem = trigger.entity;
    let genericConfig = itemUtils.getGenericFeatureConfig(originItem, 'undeadFortitude');
    if (genericConfig.bypassCritical && workflow.isCritical) return;
    let bypassDamageTypes = genericConfig.bypassDamageTypes;
    if (bypassDamageTypes.includes(workflow.defaultDamageType)) return;
    let targetActor = trigger.token.actor;
    let damageDealt = ditem.totalDamage;
    let saveActivity = originItem.system.activities.getByType('save')[0];
    let featureWorkflow;
    if (saveActivity) {
        saveActivity.save.dc = {
            calculation: '',
            formula: '5 + ' + damageDealt,
            value: 5 + damageDealt
        };
        featureWorkflow = await workflowUtils.syntheticActivityRoll(saveActivity, [trigger.token]);
    } else {
        let featureData = genericUtils.duplicate(originItem.toObject());
        let activityData = {
            undeadFortitude0: {
                activation: {
                    type: 'special'
                },
                save: {
                    ability: ['con'],
                    dc: {
                        calculation: '',
                        formula: '5 + ' + damageDealt,
                        value: 5 + damageDealt
                    },
                    target: {
                        affects: {
                            type: 'self'
                        }
                    }
                },
                type: 'save'
            }
        };
        featureData.system.activities = activityData;
        featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, targetActor, [trigger.token]);
    }
    if (featureWorkflow.failedSaves.size === 1) return;
    workflowUtils.setDamageItemDamage(ditem, ditem.oldHP - 1);
}
export let undeadFortitude = {
    name: 'Undead Fortitude',
    translation: 'CHRISPREMADES.Macros.UndeadFortitude.Name',
    version: '1.1.0',
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