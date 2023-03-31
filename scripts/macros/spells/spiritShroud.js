import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function spiritShroudItem({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Spirit Shroud');
    if (!effect) return;
    let options = [
        ['Radiant', 'radiant'],
        ['Necrotic', 'necrotic'],
        ['Cold', 'cold']
    ];
    let selection = await chris.dialog('What damage type?', options);
    if (!selection) selection = 'necrotic';
    await effect.setFlag('chris-premades', 'spell.spiritShroud', selection);
}
async function spiritShroudAttack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let validAttacks = ['mwak', 'rwak', 'msak', 'rsak'];
    if (!validAttacks.includes(this.item.system.actionType)) return;
    let distance = MidiQOL.getDistance(this.token, this.targets.first(), {wallsBlock: false});
    if (distance > 10) return;
    let effect = chris.findEffect(this.actor, 'Spirit Shroud');
    if (!effect) return;
    let castLevel = effect.flags['midi-qol'].castData.castLevel;
    let damageType = effect.flags['chris-premades']?.spell?.spiritShroud;
    if (!damageType) damageType = 'necrotic';
    let diceNum;
    switch (castLevel) {
        case 3:
        case 4:
            diceNum = 1;
            break;
        case 5:
        case 6:
            diceNum = 2;
            break;
        case 7:
        case 8:
            diceNum = 3;
            break;
        case 9:
            diceNum = 4;
            break;
    }
    if (this.isCritical) diceNum = diceNum * 2;
    let queueSetup = await queue.setup(this.item.uuid, 'spiritShroud', 250);
    if (!queueSetup) return;
    let oldFormula = this.damageRoll._formula;
    let damageFormula = oldFormula + ' + ' + diceNum + 'd8[' + damageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function spiritShroudSlow(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.document.disposition === token.document.disposition) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 10) return;
    let effect = chris.findEffect(targetToken.actor, 'Spirit Shroud - Slow');
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': 'Spirit Shroud - Slow',
        'icon': origin.img,
        'origin': origin.actor.uuid,  //Not item Uuid to prevent AA from killing the animation on the source actor.
        'duration': {
            'rounds': 1
        },
        'changes': [
            {
                'key': 'system.attributes.movement.all',
                'mode': 0,
                'value': '-10',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource',
                    'combatEnd'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}
export let spiritShroud = {
    'item': spiritShroudItem,
    'attack': spiritShroudAttack,
    'slow': spiritShroudSlow
}