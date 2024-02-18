import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let feature = chris.getItem(workflow.actor, 'Martial Advantage');
    if (!feature) return;
    let turnCheck = chris.perTurnCheck(feature, 'feature', 'martialAdvantage', false);
    if (!turnCheck) return;
    let nearbyTargets = chris.findNearby(workflow.targets.first(), 5, 'enemy', false, false).filter(i => i.document.uuid != workflow.token.document.uuid);
    if (!nearbyTargets.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'martialAdvantage', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.martialAdvantage.turn', game.combat.round + '-' + game.combat.turn);
    let bonusDamage = feature.system.damage.parts[0][0] + '[' + workflow.defaultDamageType + ']';
    await chris.addToDamageRoll(workflow, bonusDamage);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.martialAdvantage.turn', '');
}
export let martialAdvantage = {
    'attack': attack,
    'end': end
}