import {combatUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !combatUtils.inCombat() || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (game.combat.round != 1) return;
    if (workflow.token.document.combatant.initiative <= workflow.targets.first().document.combatant.initiative) return;
    workflow.tracker.advantage.add(item.name, item.name);
    await workflowUtils.syntheticItemRoll(item, []);
}
export let assassinate = {
    name: 'Assassinate',
    version: '1.3.53',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: attack,
                priority: 50
            }
        ]
    }
};