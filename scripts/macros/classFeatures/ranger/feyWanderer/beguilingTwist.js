import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1 || !workflow.failedSaves.size) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.BeguilingTwist.Select', [
        ['DND5E.ConCharmed', 'charmed'],
        ['DND5E.ConFrightened', 'frightened']
    ]);
    if (!selection) return;
    let dc = workflow.activity.save?.dc.value ?? 10;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'label=' + workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Medkit.Effect.OverTime.Labels.End') + '),turn=end,saveDC=' + dc + ',saveAbility=wis,rollType=save,saveRemove=true',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                conditions: [selection]
            }
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
export let beguilingTwist = {
    name: 'Beguiling Twist',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};