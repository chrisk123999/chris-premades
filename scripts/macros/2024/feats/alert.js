import {combatUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    if (!combatUtils.inCombat() || combatUtils.combatStarted() || workflow.targets.size !== 1) return;
    if (workflow.token.document.disposition !== workflow.targets.first().document.disposition) return;
    let tokenCombatant = game.combat.getCombatantByToken(workflow.token.id);
    let targetCombatant = game.combat.getCombatantByToken(workflow.targets.first().id);
    if (tokenCombatant?.initiative === null || targetCombatant?.initiative === null ) return;
    let tokenInitiative = tokenCombatant.initiative;
    genericUtils.update(tokenCombatant, {initiative: targetCombatant.initiative})
    genericUtils.update(targetCombatant, {initiative: tokenInitiative})
 }

export let alert = {
    name: 'Alert',
    version: '1.2.36',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
            },
        ]
    }
};