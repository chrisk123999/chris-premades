import {genericUtils, workflowUtils} from '../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size) return;
    genericUtils.updateTargets(workflow.targets.filter(i => i.actor.system.abilities.int.value > 2));
}
async function use({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
}
export let synapticStatic = {
    name: 'Synaptic Static',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};