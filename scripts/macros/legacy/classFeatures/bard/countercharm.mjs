import {actorUtils, automationUtils, constants, documentUtils, effectUtils} from '../../../../proxy.mjs';
async function begin({workflow}) {
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return;
    for (const effect of actorUtils.getEffects(workflow.actor)) {
        if (effect.origin !== sourceEffect.uuid && documentUtils.getIdentifier(effect) !== 'counterCharmEffect') continue;
        return await effectUtils.resetDuration(effect);
    }
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        copyConfigs: automationUtils.getConfigValues(workflow.item, ['conditions', 'distance']),
        duration: sourceEffect.duration
    });
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function aura({actor: target, document: effect, identifier}) {
    if (target.id === effect.parent.id) return;
    if (actorUtils.getEffectByIdentifier(target, identifier + 'Aura')) return;
    return { effectData: {
        name: effect.name,
        img: effect.img,
        origin: effect.origin,
        flags: {dae: {showIcon: true}},
        system: {changes: effect.changes}
    }};
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
