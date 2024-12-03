import {combatUtils} from '../../lib/utilities/combatUtils.js';
import {constants, genericUtils, tokenUtils} from '../../utils.js';
async function perTurnCheck(actor, mastery) {
    if (!combatUtils.inCombat()) return true;
    let previousTurn = actor.flags['chris-premades']?.mastery?.[mastery]?.turn;
    return previousTurn !== combatUtils.currentTurn();
}
async function setTurnCheck(actor, mastery) {
    let turn = game.combat.round + '-' + game.combat.turn;
    await genericUtils.setFlag(actor, 'chris-premades', 'mastery.' + mastery + '.turn', turn);
}
async function cleave(workflow) {
    if (!workflow.hitTargets.size) return;
    let target = workflow.hitTargets.first();
    let targetNearbyAllies = tokenUtils.findNearby(target, 5, 'ally');
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => i != target && targetNearbyAllies.includes(i));
    console.log(nearbyTargets);
    if (!nearbyTargets.length) return;
    let selection = await dialogUtils.selectTargetDialog('CHRISPREMADES.Mastery.Cleave.Name', 'CHRISPREMADES.Cleave.Use', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    if (!selection?.length) return;
    await setTurnCheck(workflow.actor, 'cleave');
    selection = selection[0];
    //TODO: Clone the item here and attack. Come back to this later.
}
async function graze(workflow) {

}
let masteryList = {
    cleave,
    graze
};
async function RollComplete(workflow) {
    if (!workflow.targets.size || !workflow.item || !workflow.actor || !workflow.token) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let baseItem = workflow.item.system.type.baseItem;
    if (baseItem === '') return;
    if (!workflow.actor.system.traits.weaponProf.mastery.value.has(baseItem)) return;
    let mastery = workflow.item.system.mastery;
    if (!mastery) return;
    if (!perTurnCheck(workflow.actor, mastery)) return;
    if (masteryList[mastery]) await masteryList[mastery](workflow);
}
export let masteries = {
    RollComplete
};