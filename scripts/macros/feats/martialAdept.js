import {itemUtils} from '../../utils.js';
import {superiorityHelper} from '../classFeatures/fighter/battleMaster/superiorityDice.js';

async function hit({workflow}) {
    let superiorityDice = itemUtils.getItemByIdentifier(workflow.actor, 'superiorityDice');
    if (superiorityDice) return;
    await superiorityHelper(workflow);
}
export let martialAdept = {
    name: 'Martial Adept',
    version: '1.0.7',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hit,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Martial Adept': [
                'Martial Adept: Ambush',
                'Martial Adept: Bait and Switch',
                'Martial Adept: Brace',
                'Martial Adept: Commander\'s Strike',
                'Martial Adept: Commanding Presence',
                'Martial Adept: Disarming Attack',
                'Martial Adept: Distracting Strike',
                'Martial Adept: Evasive Footwork',
                'Martial Adept: Feinting Attack',
                'Martial Adept: Goading Attack',
                'Martial Adept: Grappling Strike',
                'Martial Adept: Lunging Attack',
                'Martial Adept: Maneuvering Attack',
                'Martial Adept: Menacing Attack',
                'Martial Adept: Parry',
                'Martial Adept: Precision Attack',
                'Martial Adept: Pushing Attack',
                'Martial Adept: Quick Toss',
                'Martial Adept: Rally',
                'Martial Adept: Riposte',
                'Martial Adept: Sweeping Attack',
                'Martial Adept: Tactical Assessment',
                'Martial Adept: Trip Attack'
            ]
        }
    }
};