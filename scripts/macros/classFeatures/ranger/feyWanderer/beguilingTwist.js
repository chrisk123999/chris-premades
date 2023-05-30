import {chris} from '../../../../helperFunctions.js';
export async function beguilingTwist({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.failedSaves.size != 1) return;
    let selection = await chris.dialog('What condition?', [['Charmed', 'Charmed'], ['Frightened', 'Frightened']]);
    if (!selection) return;
    let spellDC = chris.getSpellDC(workflow.item);
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.midi-qol.OverTime',
                'mode': 0,
                'value': 'label=' + workflow.item.name + ' (End of Turn),turn=end,saveDC=' + spellDC + ',saveAbility=wis,savingThrow=true',
                'priority': 20
            },
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': selection,
                'priority': 20
            }
        ]
    }
    await chris.createEffect(workflow.targets.first().actor, effectData);
}