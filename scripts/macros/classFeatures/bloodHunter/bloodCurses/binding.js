import {chris} from '../../../../helperFunctions.js';
export async function binding({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let amplify = await chris.dialog('Amplify Blood Curse?', [['Yes', true], ['No', false]]);
    if (!amplify) {
        if (chris.getSize(workflow.targets.first()) > chris.sizeStringValue('large')) {
            ui.notifications.info('Target is too big!');
        }
        return;
    }
    let damageDice = workflow.actor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let roll = await new Roll(damageDice + '[none]').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    await chris.applyDamage(workflow.token, roll.total, 'none');
    let effect = chris.findEffect(workflow.targets.first().actor, 'Blood Curse of Binding');
    if (!effect) return;
    let saveDC = chris.getSpellDC(workflow.item);
    let updates = {
        'changes': [
            {
                'key': 'system.attributes.movement.all',
                'mode': 0,
                'priority': 20,
                'value': 0
            },
            {
                'key': 'flags.midi-qol.overTime',
                'mode': 0,
                'priority': 20,
                'value': 'turn=end, rollType=save, saveAbility=str, saveDC=' + saveDC + ', label=Blood Curse of Binding (End of Turn)'
            }
        ],
        'duration': {
            'duration': 60,
            'label': '60 Seconds',
            'remaining': 60,
            'seconds': 60,
            'type': 'seconds'
        },
        'flags': {
            'dae': {
                'specialDuration': []
            }
        }
    };
    await chris.updateEffect(effect, updates);
}