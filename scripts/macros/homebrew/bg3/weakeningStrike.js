import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    if (workflow.targets.size != 1) return;
    let weapons = workflow.targets.first().actor.items.filter(i => i.system.equipped && i.type === 'weapon');
    if (weapons.length) return;
    let effectData = {
        'label': 'Invalid Creature',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.str',
                'mode': 2,
                'value': '99',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave.con'
                ]
            }
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.weakeningStrike ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.weakeningStrike': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
export let weakeningStrike = {
    'item': item,
    'turn': turn
}