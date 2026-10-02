import {workflowUtils} from '../../../../../proxy.mjs';
function hasNotActed(combat, token) {
    const combatant = token.combatant;
    if (!combatant) return true;
    const index = combat.turns.indexOf(combatant);
    if (index === -1) return true;
    return index > combat.turn;
}
async function attack({document: item, workflow}) {
    if (!workflow.targets.size || !workflow.token || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const combat = workflow.token.document.combatant?.combat;
    if (!combat || combat.round !== 1) return;
    const targetToken = workflow.targets.first().document;
    if (!hasNotActed(combat, targetToken)) return;
    workflow.tracker.advantage.add('assassinate', item.name);
}
export const assassinate = {
    name: 'Assassinate',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ]
};
