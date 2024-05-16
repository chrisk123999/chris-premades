import {chris} from '../../helperFunctions.js';
export async function guardianOfNature({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog(workflow.item.name, [['🐺 Primal Beast', 'beast'], ['🌳 Great Tree', 'tree']], 'What form do you assume?');
    if (!selection) return;
    let effectData;
    if (selection === 'beast') {
        effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 60
            },
            'changes': [
                {
                    'key': 'system.attributes.movement.walk',
                    'mode': 2,
                    'value': '+10',
                    'priority': 20
                },
                {
                    'key': 'system.attributes.senses.darkvision',
                    'mode': 4,
                    'value': '120',
                    'priority': 20
                },
                {
                    'key': 'ATL.dimSight',
                    'mode': 4,
                    'value': '120',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.attack.str',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.mwak.damage',
                    'mode': 2,
                    'value': '+1d6[force]',
                    'priority': 20
                }
            ]
        };
    } else {
        effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 60
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.advantage.ability.save.con',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.attack.dex',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.attack.wis',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ]
        };
        if (workflow.token) await chris.applyDamage(workflow.token, 10, 'temphp');
    }
    await chris.createEffect(workflow.actor, effectData, workflow.item);
}