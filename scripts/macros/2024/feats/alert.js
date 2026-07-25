import {combatUtils, dialogUtils, genericUtils} from '../../../utils.js';
function validToken(tokenDocument, self) {
    if (!tokenDocument.actor) return;
    if (self.disposition !== tokenDocument.disposition) return;
    if (tokenDocument.actor.statuses.has('incapacitated')) return;
    return true;
}
async function use({workflow}) {
    if (!combatUtils.inCombat() || game.combat.round > 1 || game.combat.turn > 0) return;
    let self = workflow.token.document;
    if (!validToken(self, self)) return;
    let tokenCombatant = game.combat.getCombatantByToken(self.id);
    if (!tokenCombatant || tokenCombatant.initiative === null) return;
    let targetCombatant;
    for(let t of workflow.targets) {
        if (!validToken(t.document, self)) continue;
        let combatant = game.combat.getCombatantByToken(t.id);
        if (!combatant || combatant.initiative === null) continue;
        targetCombatant = combatant;
        break;
    }
    if (!targetCombatant) {
        let targets = [];
        for (let c of game.combat.combatants) {
            if (c.tokenId === self.id) continue;
            if (c.initiative === null) continue;
            let t = game.scenes.get(c.sceneId)?.tokens.get(c.tokenId);
            if (!t || !validToken(t, self)) continue;
            targets.push(c);
        }
        if (!targets.length) return;
        let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Combat.LegendaryActions.Target.Title', targets);
        if (!selection) return;
        targetCombatant = selection;
    }
    let tokenInitiative = tokenCombatant.initiative;
    genericUtils.update(tokenCombatant, {initiative: targetCombatant.initiative}, {}, true);
    genericUtils.update(targetCombatant, {initiative: tokenInitiative}, {}, true);
}
export let alert = {
    name: 'Alert',
    version: '1.5.42',
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