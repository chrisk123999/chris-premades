import {actorUtils, documentUtils, effectUtils, genericUtils} from '../../../proxy.mjs';
async function damaged({workflow}) {
    if (workflow.activity.identifier !== 'sickening-radiance-damage') return;
    const concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await Promise.all(Array.from(workflow.failedSaves, async token => {
        const actor = token.actor;
        if (!actor) return;
        const exhaustion = actor.system.attributes.exhaustion ?? 0;
        if (!actorUtils.getEffectByIdentifier(actor, 'sickeningRadiance')) {
            const effectData = documentUtils.getEffectData(workflow.activity, 'sickRadSickened1');
            genericUtils.setProperty(effectData, 'flags.chris-premades.sickeningRadiance.exhaustion', exhaustion);
            const [effect] = await effectUtils.createEffects(actor, [effectData]) ?? [];
            if (effect && concentration) await documentUtils.makeDependent(concentration, [effect]);
        }
        await actorUtils.addExhaustion(actor);
    }));
}
async function recovered({document: effect}) {
    const original = effect.flags['chris-premades']?.sickeningRadiance?.exhaustion;
    if (effect.parent && original !== undefined) await documentUtils.update(effect.parent, {'system.attributes.exhaustion': original});
}
export const sickeningRadiance = {
    name: 'Sickening Radiance',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: damaged, priority: 50}
    ]
};
export const sickeningRadianceSickened = {
    name: 'Sickening Radiance: Sickened',
    version: sickeningRadiance.version,
    rules: sickeningRadiance.rules,
    effect: [
        {pass: 'deleted', macro: recovered, priority: 50}
    ]
};
