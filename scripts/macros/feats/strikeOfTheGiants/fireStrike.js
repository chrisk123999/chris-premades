import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let originFeature = chris.getItem(workflow.actor, 'Strike of the Giants: Fire Strike');
    if (!originFeature) return;
    if (!originFeature.system.uses.value) return;
    let turnCheck = chris.perTurnCheck(originFeature, 'feat', 'fireStrike', false, workflow.token.id);
    if (!turnCheck) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fireStrike', 150);
    if (!queueSetup) return;
    let selection = await chris.dialog(originFeature.name, [['Yes', true], ['No', false]], 'Use ' + originFeature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await originFeature.update({'system.uses.value': originFeature.system.uses.value - 1});
    if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feat.fireStrike.turn', game.combat.round + '-' + game.combat.turn);
    let damageFormula = workflow.damageRoll._formula;
    let bonusDamage = '1d10[' + translate.damageType('fire') + ']';
    if (workflow.isCritical) bonusDamage = chris.getCriticalFormula(bonusDamage);
    let damageRoll = await new Roll(damageFormula + ' + ' + bonusDamage).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    await originFeature.displayCard();
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feat.fireStrike.turn', '');
}
export let fireStrike = {
    'damage': damage,
    'end': end
}