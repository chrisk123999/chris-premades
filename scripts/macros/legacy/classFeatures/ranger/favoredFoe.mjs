import {automationUtils, DamageBonus, documentUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (workflow.targets.size !== 1) return;
    const targetToken = workflow.targets.first().document;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'favoredFoe',
        activityUuid: workflow.activity.uuid,
        specialDuration: ['zeroHP']
    });
    genericUtils.setProperty(sourceEffectData, 'flags.chris-premades.favoredFoe.target', targetToken.id);
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [sourceEffectData], {parentEntity: concentrationEffect});
    if (!sourceEffect) return;
    const targetEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'favoredFoeTarget',
        activityUuid: workflow.activity.uuid,
        specialDuration: ['zeroHP']
    });
    await effectUtils.createEffects(targetToken.actor, [targetEffectData], {parentEntity: sourceEffect});
}
async function damage({document: item, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const targetToken = workflow.hitTargets.first().document;
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'favoredFoe');
    if (effect && effect.flags['chris-premades']?.favoredFoe?.target !== targetToken.id) return;
    if (!effect && !item.system.uses.value) return;
    const turnLimit = itemUtils.getActivityByIdentifier(item, 'favored-foe-turn');
    if (!turnLimit?.uses.value) return;
    const bonus = new DamageBonus(item, {formula: automationUtils.getConfigValue(item, 'formula'), optional: !effect, maxTargets: 1, type: workflow.defaultDamageType})
        .withOnUse(async () => {
            if (!effect) await workflowUtils.completeItemUse(item, [targetToken]);
            await documentUtils.update(turnLimit, {'uses.spent': turnLimit.uses.spent + 1});
        });
    bonus.targets = [targetToken];
    return bonus;
}
export const favoredFoe = {
    name: 'Favored Foe',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 150
        }
    ],
    config: {
        classIdentifier: {
            default: 'ranger',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        formula: {
            default: '@scale.ranger.favored-foe',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'favored-foe',
            classIdentifier: 'ranger',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'favored-foe',
                    type: 'dice',
                    scale: {
                        1: {
                            number: 1,
                            faces: 4,
                            modifiers: []
                        },
                        6: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        14: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Favored Foe',
                icon: null
            }
        }
    ]
};
