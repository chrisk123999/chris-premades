import {combatUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !combatUtils.inCombat() || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (game.combat.round != 1) return;
    if (workflow.token.document.combatant.initiative <= workflow.targets.first().document.combatant.initiative) return;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
    workflow.advantage = true;
    await workflowUtils.syntheticItemRoll(item, []);
}
export let assassinate = {
    name: 'Assassinate',
    version: '1.3.53',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};