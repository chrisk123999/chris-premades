import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function spiritShroudItem(workflow) {
    let effect = chris.findEffect(workflow.actor, 'Spirit Shroud');
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
async function spiritShroudAttack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let validAttacks = ['mwak', 'rwak', 'msak', 'rsak'];
    if (!validAttacks.includes(workflow.item.system.actionType)) return;
    let distance = MidiQOL.getDistance(workflow.token, workflow.targets.first(), {wallsBlock: false});
    if (distance > 10) return;
    let effect = chris.findEffect(workflow.actor, 'Spirit Shroud');
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
    if (workflow.isCritical) diceNum = diceNum * 2;
    let queueSetup = await queue.setup(workflow.item.uuid, 'spiritShroud', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let damageFormula = oldFormula + ' + ' + diceNum + 'd8[' + damageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}
async function spiritShroudSlow(token, origin) {
    let targetTokens = chris.findNearby(token, 10, 'enemy');
    if (targetTokens.length === 0) return;
    let targetToken =  targetTokens.find(i => i.id === game.combat.current.tokenId);
    if (!targetToken) return;
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