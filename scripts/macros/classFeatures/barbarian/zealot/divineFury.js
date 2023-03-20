import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || this.item.type != 'weapon') return;
    let effect = chris.findEffect(this.actor, 'Rage');
    if (!effect) return;
    let divineEffect = chris.findEffect(this.actor, 'Divine Fury');
    if (!divineEffect) return;
    let originItem = await fromUuid(divineEffect.origin);
    if (!originItem) return;
    let classLevels = this.actor.classes.barbarian?.system?.levels;
    if (!classLevels) return;
    let barbDamage = Math.floor(classLevels / 2);
    let damageType = this.actor.flags['chris-premades']?.feature?.divineFury?.damageType;
    if (!damageType) return;
    let queueSetup = await queue.setup(this.item.uuid, 'divineFury', 250);
    if (!queueSetup) return;
    let doExtraDamage = chris.perTurnCheck(originItem, 'feature', 'divineFury', true, this.token.id);
    if (!doExtraDamage) {
        queue.remove(this.item.uuid);
        return;
    }
    let selection = await chris.dialog('Divine Fury: Apply extra damage?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feature.divineFury.turn', game.combat.round + '-' + game.combat.turn);
    let diceNumber = 1;
    if (this.isCritical) diceNumber = 2;
    let bonusDamage = 'd6[' + damageType + '] + ' + barbDamage;
    let damageFormula = this.damageRoll._formula + ' + ' + diceNumber + bonusDamage;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.divineFury.turn', '');
}
export let divineFury = {
    'attack': attack,
    'end': end
}