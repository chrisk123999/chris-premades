import {actorUtils, automationUtils, constants, dataUtils, documentUtils, effectUtils} from '../../../../proxy.mjs';
async function begin({workflow}) {
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        copyConfigs: automationUtils.getConfigValues(workflow.item, ['conditions', 'distance']),
        duration: sourceEffect.duration
    });
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function aura({actor, document: effect, identifier}) {
    if (actor.id === effect.parent.id) return;
    if (actorUtils.getEffectByIdentifier(actor, identifier + 'Aura')) return;
    const effectData = dataUtils.buildEffectData(effect.toObject(), {
        removeMacros: [{type: 'aura', macros: [{identifier: 'countercharmAura', source: 'chris-premades'}]}],
        specialDuration: []
    });
    delete effectData.duration;
    return {effectData};
}
export const countercharm = {
    name: 'Countercharm',
    version: '2.0.2',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: begin,
            priority: 50
        }
    ],
    config: {
        conditions: {
            default: ['deafened'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            get options() { return constants.statusOptions(); }
        },
        distance: {
            default: 30,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance'
        }
    }
};
export const countercharmAura = {
    name: countercharm.name,
    version: countercharm.version,
    rules: countercharm.rules,
    aura: [
        {
            pass: 'update',
            macro: aura,
            priority: 100,
            configDisabled: 'conditions',
            configDistance: 'distance',
            dispositions: ['ally']
        }
    ]
};
