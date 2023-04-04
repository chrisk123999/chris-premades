import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function reroll({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0 || !this.damageRoll || !['mwak', 'rwak', 'msak', 'rsak'].includes(this.item.system.actionType)) return;
    let effect = chris.findEffect(this.actor, 'Piercer: Reroll Damage');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let doExtraDamage = chris.perTurnCheck(originItem, 'feat', 'piercer', false, this.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(this.item.uuid, 'piercerReroll', 390);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!damageTypes.has('piercing')) {
        queue.remove(this.item.uuid);
        return;
    }
    let autoPiercer = this.actor.flags['chris-premades']?.feat?.piercer?.auto;
    let lowRoll = null;
    let lowRollDice = null;
    let resultI;
    let resultJ;
    for (let i = 0; this.damageRoll.terms.length > i; i++) {
        let term = this.damageRoll.terms[i];
        if (!term.faces) continue;
        for (let j = 0; term.results.length > j; j++) {
            if (term.results[j].result > lowRoll && lowRoll != null) continue;
            if (term.results[j].result === lowRoll && term.faces < lowRollDice) continue;
            lowRoll = term.results[j].result;
            lowRollDice = term.faces;
            resultI = i;
            resultJ = j;
        }
    }
    if (autoPiercer) {
        if (lowRoll > autoPiercer) {
            queue.remove(this.item.uuid);
            return;
        }
    } else {
        let selection = await chris.dialog('Piercer: Reroll low roll of ' + lowRoll + '?', [['Yes', true], ['No', false]]);
        if (!selection) {
            queue.remove(this.item.uuid);
            return;
        }
    }
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feat.piercer.turn', game.combat.round + '-' + game.combat.turn);
    let roll = await new Roll('1d' + lowRollDice).roll({async: true});
    let newDamageRoll = this.damageRoll;
    newDamageRoll.terms[resultI].results[resultJ].result = roll.total;
    newDamageRoll._total = newDamageRoll._evaluateTotal();
    await this.setDamageRoll(newDamageRoll);
    await originItem.use();
    queue.remove(this.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feat.piercer.turn', '');
}
async function critical({speaker, actor, token, character, item, args}) {
    if (!this.isCritical || !this.damageRoll) return;
    let queueSetup = await queue.setup(this.item.uuid, 'piercerCritical', 250);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!damageTypes.has('piercing')) {
        queue.remove(this.item.uuid);
        return;
    }
    let largeDice;
    let flavor;
    for (let i of this.damageRoll.terms) {
        if (!i.faces) continue;
        if (largeDice > i.faces) continue;
        largeDice = i.faces;
        flavor = i.flavor.toLowerCase();
    }
    let damageFormula = this.damageRoll._formula + ' + 1d' + largeDice + '[' + flavor + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    let effect = chris.findEffect(this.actor, 'Piercer: Critical Hit');
    if (effect) {
        let originItem = await fromUuid(effect.origin);
        if (originItem) await originItem.use();
    }
    queue.remove(this.item.uuid);
}
export let piercer = {
    'reroll': reroll,
    'combatEnd': combatEnd,
    'critical': critical
}