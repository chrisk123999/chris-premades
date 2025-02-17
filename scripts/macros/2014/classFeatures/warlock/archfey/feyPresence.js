import {actorUtils, dialogUtils, effectUtils} from '../../../../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.BeguilingTwist.Select', [
        ['DND5E.ConCharmed', 'charmed'],
        ['DND5E.ConFrightened', 'frightened']
    ]);
    if (!selection) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 12
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnEndSource'
                ]
            },
            'chris-premades': {
                conditions: [selection]
            }
        }
    };
    for (let target of workflow.failedSaves) {
        if (!actorUtils.checkTrait(target.actor, 'ci', selection)) await effectUtils.createEffect(target.actor, effectData);
    }
}
export let feyPresence = {
    name: 'Fey Presence',
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