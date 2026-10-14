import {documentUtils, effectUtils} from '../../../proxy.mjs';
async function use({workflow}) {
    if (workflow.targets.size || workflow.activity.identifier === 'heroism-temp-hp') return;
    await effectUtils.endConcentration(workflow.actor, workflow.item);
}
async function deleted({document}) {
    const actor = effectUtils.getActor(document);
    if (!actor?.system.attributes.hp.temp) return;
    await documentUtils.update(actor, {'system.attributes.hp.temp': 0});
}
export const heroism = {
    name: 'Heroism',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const heroismEffect = {
    name: 'Heroism: Effect',
    version: '2.1.3',
    rules: 'all',
    effect: [
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ]
};
