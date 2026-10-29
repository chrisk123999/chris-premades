import {actorUtils, documentUtils} from '../../../proxy.mjs';
async function use({workflow}) {
    const actor = (workflow.targets.first() ?? workflow.token)?.actor ?? workflow.actor;
    const poisoned = actorUtils.getStatusSources(actor, ['poisoned']) ?? [];
    await Promise.all(poisoned.map(effect => documentUtils.deleteDocument(effect)));
    if (actor.system.attributes.exhaustion) await documentUtils.update(actor, {'system.attributes.exhaustion': 0});
}
function maximize({options}) {
    options.maximize = true;
}
export const potionOfVitality = {
    name: 'Potion of Vitality',
    version: '2.1.5',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const potionOfVitalityEffect = {
    name: 'Potion of Vitality: Effect',
    version: potionOfVitality.version,
    rules: potionOfVitality.rules,
    hitDie: [
        {
            pass: 'actorSituational',
            macro: maximize,
            priority: 50
        }
    ]
};
