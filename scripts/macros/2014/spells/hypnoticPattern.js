import {effectUtils, genericUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        await genericUtils.remove(concentrationEffect);
        return;
    }
    await workflowUtils.handleInstantTemplate(workflow);
}
async function everyTurn({trigger: {entity: effect}}) {
    if (effect) await genericUtils.remove(effect);
}
export let hypnoticPattern = {
    name: 'Hypnotic Pattern',
    version: '1.1.0',
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
export let hypnoticPatternRemove = {
    name: 'Hypnotic Pattern: Remove',
    version: hypnoticPattern.version,
    combat: [
        {
            pass: 'everyTurn',
            macro: everyTurn,
            priority: 250
        }
    ]
};