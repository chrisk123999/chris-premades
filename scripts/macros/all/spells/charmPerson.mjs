import {tokenUtils, workflowUtils} from '../../../proxy.mjs';
function early({document, workflow}) {
    for (const target of workflow.targets.documents) {
        if (tokenUtils.getCombatData(target).inCombat) workflowUtils.grantRollModifier(workflow, 'adv', target.id, 'charm-person', document.name);
    }
}
export const charmPerson = {
    name: 'Charm Person',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: early,
            priority: 100
        }
    ]
};
