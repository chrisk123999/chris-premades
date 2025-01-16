import {activityUtils, effectUtils, itemUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                priority: 20,
                value: 'turn=end, allowIncapacitated=true, rollType=save, saveAbility=con, saveDC=' + itemUtils.getSaveDC(workflow.item) + ', saveMagic=true'
            }
        ]
    };
    await Promise.all(workflow.failedSaves.map(async token => {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item, conditions: [identifier]});
    }));
}
export let blindnessDeafness = {
    name: 'Blindness/Deafness',
    version: '1.1.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};