import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(this.item.system.actionType)) return;
    let effectFeature = chris.findEffect(this.actor, 'Grave Touched');
    if (!effectFeature) return;
    let feature = await fromUuid(effectFeature.origin);
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'graveTouched,', true, this.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(this.item.uuid, 'graveTouched', 350);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Grave Touched?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    await feature.use();
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.formOfDread.turn', game.combat.round + '-' + game.combat.turn);
    let oldDamageRoll = this.damageRoll;
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
    let effect = chris.findEffect(this.actor, 'Form of Dread');
    if (effect) {
        let extraDice = '+ 1d' + this.damageRoll.dice[0].faces + '[necrotic]';
        if (this.isCritical) extraDice = chris.getCriticalFormula(extraDice);
        damageFormula = newDamageRoll + extraDice;
    }
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.graveTouched.turn', '');
}
export let graveTouched = {
    'attack': attack,
    'end': end
}