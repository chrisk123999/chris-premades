import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let feature = chris.getItem(workflow.actor, 'Grave Touched');
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'graveTouched,', true, workflow.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'graveTouched', 350);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.use();
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.formOfDread.turn', game.combat.round + '-' + game.combat.turn);
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
        let extraDice = '+ 1d' + workflow.damageRoll.dice[0].faces + '[necrotic]';
        if (workflow.isCritical) extraDice = chris.getCriticalFormula(extraDice);
        damageFormula = newDamageRoll + extraDice;
    }
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.graveTouched.turn', '');
}
export let graveTouched = {
    'attack': attack,
    'end': end
}
