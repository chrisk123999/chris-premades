import {automationUtils, D20Bonus, documentUtils, effectUtils, genericUtils, Logging} from '../../../../proxy.mjs';
async function grantInspiration({workflow}) {
    if (workflow.targets.size !== 1) return Logging.addMacroWarning('CPR', 'bardic-inspiration', 'Select exactly one target.');
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return Logging.addMacroWarning('CPR', 'bardic-inspiration', 'Inspiration effect missing from item.', {notify: 'warn'});
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
async function useInspiration({document: effect}) {
    const rules = documentUtils.getRules(effect);
    const phase = rules === '2024' ? 'postResult' : rules === '2014' ? 'preResult' : ['preResult', 'postResult'];
    const formula = effect.flags['chris-premades']?.bardicInspiration;
    if (!formula) return Logging.addMacroWarning('CPR', 'bardicInspirationEffect', 'Bardic Inspiration die formula not found.', {notify: 'warn'});
    return new D20Bonus(effect, {action: 'special', actor: effect.actor, formula, phase}).withOnUse(postUseInspiration);
}
async function postUseInspiration({bonus, workflow}) {
    await automationUtils.calledEvent('useBardicInspiration', bonus.actor, {canOverlap: true, data: {
        bonus, workflow,
        roll: bonus.roll,
        sourceActor: bonus.activity.actor,
        targetActor: bonus.targetActor
    }});
    await documentUtils.deleteDocument(bonus.document);
}
export const bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '2.1.7',
    rules: 'all',
    notes: 'Use the "actorPreCreateBardicInspiration" called event (async) to modify the bardic inspiration effect.\n\tData available: activity, effectData, rules, sourceActor, sourceToken, targetActor, targetToken.\nUse "actorCreatedBardicInspiration" (async) to respond when inspiration is granted.\n\tData available: activity, effect, rules, sourceActor, sourceToken, targetActor, targetToken.\nUse "actorUseBardicInspiration" to respond when inspiration is used.\n\tData available: bonus, roll, sourceActor, targetActor, workflow.',
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
            type: 'formula',
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
const d20 = [{
    pass: 'actorOptionalBonus',
    macro: useInspiration,
    priority: 300
}];
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
    check: d20,
    save: d20,
    skill: d20,
    tool: d20
};
