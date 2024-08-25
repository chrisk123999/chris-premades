import { genericUtils } from '../utils.js';
function updateSummonInitiative(actor, [combatant]) {
    console.log(actor, [combatant]);
    for (let c of combatant?.parent?.combatants?.contents.filter(i => i.actorId != actor.id).filter(i => i.actor.flags['chris-premades']?.control?.actor === actor?.uuid) ?? []) {
        if (c.initiative === null) {
            if (game.user.isGM) c.update({'initiative': combatant.initiative - 0.01});
            //else socket.executeAsGM('updateInitiative', c.uuid, combatant.initiative - 0.01);
        }
    }
}
function updateCompanionInitiative() {

}
export let initiative = {
    updateCompanionInitiative: updateCompanionInitiative,
    updateSummonInitiative: updateSummonInitiative
};