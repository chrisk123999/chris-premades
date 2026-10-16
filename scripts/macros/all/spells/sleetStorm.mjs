import {documentUtils} from '../../../proxy.mjs';
async function concentration({workflow}) {
    if (workflow.activity.identifier !== 'sleet-storm-prone') return;
    const rules = documentUtils.getRules(workflow.item);
    const dc = workflow.activity.save.dc.value;
    for (const token of workflow.targets) {
        const actor = token.actor;
        if (!actor?.concentration?.effects.size) continue;
        if (rules === '2024') {
            if (workflow.failedSaves.has(token)) await Promise.all(Array.from(actor.concentration.effects, effect => documentUtils.deleteDocument(effect)));
            continue;
        }
        await actor.rollConcentration({target: dc}, {configure: false});
    }
}
export const sleetStorm = {
    name: 'Sleet Storm',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: concentration, priority: 50}
    ]
};
