import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || this.isFumble || this.item.type != 'weapon') return;
    let effect = chris.findEffect(this.actor, 'Divine Strike');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let doExtraDamage = chris.perTurnCheck(feature, 'feature', 'divineStrike', true, this.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(this.item.uuid, 'divineStrike', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog('Divine Strike: Apply extra damage?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.divineStrike.turn', game.combat.round + '-' + game.combat.turn);
    let diceNumber = 1;
    let classLevels = this.actor.classes.cleric?.system?.levels;
    let subClassIdentifier = this.actor.classes.cleric?.subclass?.identifier;
    if (!classLevels || !subClassIdentifier) {
        queue.remove(this.item.uuid);
        return;
    }
    let damageType;
    switch (subClassIdentifier) {
        case 'death-domain':
            damageType = 'necrotic';
            break;
        case 'forge-domain':
            damageType = 'fire';
            break;
        case 'light-domain':
            damageType = 'radiant';
            break;
        case 'nature-domain':
            damageType = await chris.dialog('What damage type?', [['Acid', 'acid'], ['Cold', 'cold'], ['Fire', 'fire'], ['Lightning', 'lightning'], ['Thunder', 'thunder']]);
            if (!damageType) {
                queue.remove(this.item.uuid);
                return;
            }
            break;
        case 'order-domain':
            damageType = 'psychic';
            break;
        case 'tempest-domain':
            damageType = 'thunder';
            break;
        case 'trickery-domain':
            damageType = 'poison';
            break;
        case 'war-domain':
            damageType = this.defaultDamageType;
            break;
        default:
            damageType = 'radiant';
            break;
    }
    if (classLevels >= 14) diceNumber += 1;
    let bonusDamageFormula = diceNumber + 'd8[' + damageType + ']';
    if (this.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = this.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.divineStrike.turn', '');
}
export let divineStrike = {
    'item': item,
    'combatEnd': combatEnd
}