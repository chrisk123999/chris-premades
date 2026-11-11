import {documentUtils, tokenUtils} from '../../../proxy.mjs';
async function preChecks({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.activity);
    if (identifier === 'unarmed-strike') return;
    if (!['grapple', 'shove-prone', 'shove-push'].includes(identifier)) return;
    const target = workflow.targets.documents[0];
    if (!target || await tokenUtils.grappleShoveSizeCheck(workflow.token.document, target, identifier)) return;
    workflow.aborted = true;
    return true;
}
export const unarmedStrike = {
    name: 'Unarmed Strike',
    rules: '2024',
    version: '2.1.3',
    notes: 'Use the "grappleShoveSizeCheck" event (async) to respond to grapples and shoves before the item roll. Return a number to change the actor size used in target comparisons.',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: preChecks,
            priority: 100
        }
    ]
};
