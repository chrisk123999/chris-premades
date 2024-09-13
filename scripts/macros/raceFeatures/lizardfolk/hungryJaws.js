import {workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (!workflow.hitTargets.size) return;
    await workflowUtils.applyDamage([workflow.token], workflow.actor.system.attributes.prof, 'temphp');
}
export let hungryJaws = {
    name: 'Hungry Jaws',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};