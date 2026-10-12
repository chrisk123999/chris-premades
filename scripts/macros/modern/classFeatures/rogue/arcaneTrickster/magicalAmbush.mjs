import {combatUtils, workflowUtils} from '../../../../../proxy.mjs';
async function cast({workflow, document}) {
    if (!workflow.targets.size || workflow.item?.type !== 'spell') return;
    if (!workflow.actor.statuses.has('invisible')) return;
    if (workflow.token.document.inCombat && !combatUtils.isOwnTurn(workflow.token.document)) return;
    workflow.targets.forEach(token => workflowUtils.grantRollModifier(workflow, 'dis', token.id, 'magical-ambush', document.name));
}
export const magicalAmbush = {
    name: 'Magical Ambush',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: cast,
            priority: 100
        }
    ]
};
