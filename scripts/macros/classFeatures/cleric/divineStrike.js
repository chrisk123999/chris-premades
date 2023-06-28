import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.isFumble || workflow.item.type != 'weapon') return;
    let effect = chris.findEffect(workflow.actor, 'Divine Strike');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let doExtraDamage = chris.perTurnCheck(feature, 'feature', 'divineStrike', true, workflow.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'divineStrike', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog('Divine Strike: Apply extra damage?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) await feature.setFlag('chris-premades', 'feature.divineStrike.turn', game.combat.round + '-' + game.combat.turn);
    let diceNumber = 1;
    let classLevels = workflow.actor.classes.cleric?.system?.levels;
    let subClassIdentifier = workflow.actor.classes.cleric?.subclass?.identifier;
    if (!classLevels || !subClassIdentifier) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageType = chris.getConfiguration(feature, 'damageType');
    if (!damageType || damageType === 'default') {
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
                    queue.remove(workflow.item.uuid);
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
                damageType = workflow.defaultDamageType;
                break;
            default:
                damageType = 'radiant';
                break;
        }
    }
    if (classLevels >= 14) diceNumber += 1;
    let bonusDamageFormula = diceNumber + 'd8[' + damageType + ']';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = workflow.damageRoll._formula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.divineStrike.turn', '');
}
export let divineStrike = {
    'item': item,
    'combatEnd': combatEnd
}