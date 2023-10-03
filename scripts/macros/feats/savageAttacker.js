import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak' || !workflow.token || !workflow.damageRoll) return;
    let feature = chris.getItem(workflow.actor, 'Savage Attacker');
    if (!feature) return;
    let turnCheck = chris.perTurnCheck(feature, 'feat', 'savageAttacker', false, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'savageAttacker', 101);
    if (!queueSetup) return;
    let dummyRollFormula = '';
    for (let i of workflow.item.system.damage.parts) {
        dummyRollFormula += i[0] + ' + ';
    }
    let dummyRoll = await new Roll(dummyRollFormula).roll({async: true});
    let damageTotal = 0;
    for (let i = 0; i < dummyRoll.terms.length; i++) {
        let total = workflow.damageRoll.terms[i].total;
        if (!isNaN(total)) damageTotal += total;
    }
    let autoReroll = chris.getConfiguration(feature, 'auto') ?? false;
    let autoNumber = chris.getConfiguration(feature, 'reroll') ?? 1;
    let selection = false;
    if (!autoReroll) {
        selection = await chris.dialog(feature.name, [['Yes', true], ['No', false]], 'Weapon Damage Total: <b>' + damageTotal + '</b><br>Use ' + feature.name + '?');
    } else {
        if (autoNumber >= damageTotal) selection = true;
    }
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.use();
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feat.savageAttacker.turn', game.combat.round + '-' + game.combat.turn);
    let damageRoll = await new Roll(workflow.damageRoll._formula).roll({async: true});
    let newTotal = 0;
    for (let i = 0; i < dummyRoll.terms.length; i++) {
        let total = damageRoll.terms[i].total;
        if (!isNaN(total)) newTotal += total;
    }
    if (newTotal <= damageRoll) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feat.savageAttacker.turn', null);
}
export let savageAttacker = {
    'damage': damage,
    'end': end
}