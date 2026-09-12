import {actorUtils, automationUtils, documentUtils, genericUtils, workflowUtils} from '../../../proxy.mjs';
async function preChecks({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.activity);
    if (identifier === 'unarmed-strike') return;
    const data = {
        workflow,
        identifier,
        activity: workflow.activity,
        size: actorUtils.getSize(workflow.actor),
        targets: workflow.targets.map(t => t.document)
    };
    const sizeBonuses = await automationUtils.calledEvent('unarmedStrike', workflow.actor, {canOverlap: true, multiResult: true, data});
    if (sizeBonuses?.length) data.size = sizeBonuses.reduce((sum, bonus) => typeof bonus === 'number' ? sum + bonus : sum, data.size);
    const type = identifier === 'grapple' ? 'Grapple' : 'Shove';
    const validTargets = data.targets.filter(t => {
        if (actorUtils.getSize(t.actor) <= (data.size + 1)) return true;
        return genericUtils.notify(`CHRISPREMADES.Macros.Modern.UnarmedStrike.${type}Size`, {type: 'warn'});
    });
    if (!validTargets.size) {
        workflow.aborted = true;
        return true;
    }
    await workflowUtils.updateTargets(workflow, validTargets);
}
export const unarmedStrike = {
    name: 'Unarmed Strike',
    rules: '2024',
    version: '2.0.3',
    notes: 'Use the "actorUnarmedStrike" called event (async) to respond to grapples and shoves before the item roll. Return a number to change the actor size used in target comparisons.\n\tData available: activity, identifier, size, targets, workflow.',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: preChecks,
            priority: 100
        }
    ]
};
