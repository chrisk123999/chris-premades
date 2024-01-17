import {chris} from '../../../../helperFunctions.js';
export async function songOfDefense({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = workflow.actor.effects.find(i => i.flags['chris-premades']?.feature?.bladesong);
    if (!effect) {
        ui.notifications.info('You must be Bladesinging to use this feature!');
        return;
    }
    let validLevels = [];
    for (let i = 1; i <= 9; i++) {
        let key2 = 'spell' + i;
        let key = 'system.spells.' + key2 + '.value';
        if ((workflow.actor.system.spells[key2].value > 0) && workflow.actor.system.spells[key2].max > 0) validLevels.push({'level': i, 'key': key});
    }
    let pact = workflow.actor.system.spells.pact;
    if (pact.max > 0 && pact.value > 0) validLevels.push({'level': 'p', 'key': 'system.spells.pact.value'});
    if (!validLevels.length) {
        ui.notifications.info('You have no spell slots to expend!');
        return;
    }
    let options = validLevels.map(i => [(i.level != 'p' ? chris.nth(i.level) + ' Level' : 'Pact Slot'), i.key]);
    let selection = options.length > 1 ? await chris.dialog(workflow.item.name, options, 'Expend what spell slot?') : options[0][1];
    if (!selection) return;
    let value = getProperty(workflow.actor, selection);
    if (isNaN(value)) return;
    let slotLevel = selection.split('.')[2][0] === 'p' ? workflow.actor.system.spells.pact.level : selection.split('.')[2].slice(-1);
    let damageReduction = slotLevel * 5;
    await workflow.actor.update({[selection]: value - 1});
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1,
        },
        'changes': [
            {
                'key': 'flags.midi-qol.DR.all',
                'mode': 0,
                'value': damageReduction,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    '1Reaction'
                ]
            },
        },
    }
    await chris.createEffect(actor, effectData);
}
