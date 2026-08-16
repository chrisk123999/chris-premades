import {automationUtils, D20Bonus, documentUtils, effectUtils, genericUtils} from '../../../../proxy.mjs';
async function grantInspiration({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!workflow.item.system.uses.value) return;
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return;
    const target = workflow.targets.first().document;
    const rules = documentUtils.getRules(workflow.item);
    const formula = Roll.replaceFormulaData(automationUtils.getConfigValue(workflow.item, 'bonus'), workflow.activity.getRollData());
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {rules});
    genericUtils.setProperty(effectData, 'flags.chris-premades.bardicInspiration', formula);
    const calledData = {
        activity: workflow.activity,
        sourceActor: workflow.actor,
        sourceToken: workflow.token.document,
        rules,
        targetActor: target.actor,
        targetToken: target
    };
    const edits = await automationUtils.calledEvent('preCreateBardicInspiration', workflow.actor, {canOverlap: true, multiResult: true, data: {effectData, ...calledData}});
    for (const edit of edits) genericUtils.mergeObject(effectData, edit, {applyOperators: true});
    const createdEffect = (await effectUtils.createEffects(target.actor, [effectData]))?.[0];
    if (!createdEffect) return;
    await automationUtils.calledEvent('createdBardicInspiration', workflow.actor, {canOverlap: true, data: {effect: createdEffect, ...calledData}});
}
async function useInspiration({document: effect, roll, workflow}) {
    if (!roll) roll = workflow.attackRoll;
    if (roll.isFumble) return;
    if (documentUtils.getRules(effect) === '2024' && roll.isSuccess) return;
    const formula = effect.flags['chris-premades']?.bardicInspiration;
    if (!formula) return;
    return new D20Bonus(effect, {action: 'special', actor: effect.parent, formula})
        .withOnUse(postUseInspiration)
        .initialize();
}
async function postUseInspiration({bonus}) {
    await automationUtils.calledEvent('useBardicInspiration', bonus.actor, {canOverlap: true, data: {
        bonus: bonus.roll,
        sourceActor: bonus.activity.actor,
        targetActor: bonus.targetActor
    }});
    await documentUtils.deleteDocument(bonus.document);
}
export const bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '2.0.2',
    rules: 'all',
    notes: 'Use the "actorPreCreateBardicInspiration" called event (async) to modify the bardic inspiration effect.\n\tData available: activity, effectData, rules, sourceActor, sourceToken, targetActor, targetToken.\nUse "actorCreatedBardicInspiration" (async) to respond when inspiration is granted.\n\tData available: activity, effect, rules, sourceActor, sourceToken, targetActor, targetToken.\nUse "actorUseBardicInspiration" to respond when inspiration is used.\n\tData available: bonus, sourceActor, targetActor.',
    use: postUseInspiration,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: grantInspiration,
            priority: 100
        }
    ],
    config: {
        bonus: {
            default: '@scale.bard.inspiration',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'bard',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'inspiration',
            classIdentifier: 'bard',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'inspiration',
                    type: 'dice',
                    scale: {
                        1: {number: 1, faces: 6},
                        5: {number: 1, faces: 8},
                        10: {number: 1, faces: 10},
                        15: {number: 1, faces: 12}
                    }
                },
                value: {},
                title: 'Bardic Inspiration'
            }
        }
    ]
};
export const bardicInspirationEffect = {
    name: bardicInspiration.name,
    version: bardicInspiration.version,
    rules: bardicInspiration.rules,
    roll: [ 
        {
            pass: 'actorOptionalBonusAttack',
            macro: useInspiration,
            priority: 300
        }
    ],
    check: [
        {
            pass: 'actorOptionalBonus',
            macro: useInspiration,
            priority: 300
        }
    ],
    save: [
        {
            pass: 'actorOptionalBonus',
            macro: useInspiration,
            priority: 300
        }
    ],
    skill: [
        {
            pass: 'actorOptionalBonus',
            macro: useInspiration,
            priority: 300
        }

    ],
    tool: [
        {
            pass: 'actorOptionalBonus',
            macro: useInspiration,
            priority: 300
        }
    ]
};
