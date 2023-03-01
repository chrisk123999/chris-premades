import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let effectFeature = chris.findEffect(workflow.actor, 'Grave Touched');
    if (!effectFeature) return;
    let feature = await fromUuid(effectFeature.origin);
    if (!feature) return;
    let currentTurn = '';
    let doCheck = false;
    if (game.combat === null || game.combat === undefined) {
        doCheck = true;
    } else {
        if (workflow.token.id != game.combat.current.tokenId) return;
        currentTurn = game.combat.round + '-' + game.combat.turn;
        let previousTurn = feature.flags['chris-premades']?.feature?.gt?.turn;
        if (!previousTurn != currentTurn) doCheck = true;
    }
    if (!doCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'graveTouched', 350);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Grave Touched?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.use();
    await feature.setFlag('chris-premades', 'feature.gt.turn', currentTurn);
    let oldDamageRoll = workflow.damageRoll;
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (isDeterministic === true) {
            newDamageRoll += oldDamageRoll.terms[i].expression;
        } else {
            newDamageRoll += oldDamageRoll.terms[i].number + 'd' + oldDamageRoll.terms[i].faces + '[necrotic]';
        }
    }
    let damageFormula = newDamageRoll;
    let effect = chris.findEffect(workflow.actor, 'Form of Dread');
    if (effect) {
        let diceNum = 1;
        if (workflow.isCritical) diceNum = 2;
        let extraDice = '+ ' + diceNum + 'd' + workflow.damageRoll.dice[0].faces + '[necrotic]';
        damageFormula = newDamageRoll + extraDice;
    }
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.gt.turn', '');
}
export let graveTouched = {
    'attack': attack,
    'end': end
}