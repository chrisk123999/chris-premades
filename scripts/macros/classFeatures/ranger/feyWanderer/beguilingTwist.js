import {chris} from '../../../../helperFunctions.js';
export async function beguilingTwist({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1 || this.failedSaves.size != 1) return;
    let selection = await chris.dialog('What condition?', [['Charmed', 'Charmed'], ['Frightened', 'Frightened']]);
    if (!selection) return;
    let spellDC = chris.getSpellDC(this.item);
    let effectData = {
        'label': this.item.name,
        'icon': this.item.img,
        'origin': this.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.midi-qol.OverTime',
                'mode': 0,
                'value': 'label=' + this.item.name + ' (End of Turn),turn=end,saveDC=' + spellDC + ',saveAbility=wis,savingThrow=true',
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
    await chris.createEffect(this.targets.first().actor, effectData);
}