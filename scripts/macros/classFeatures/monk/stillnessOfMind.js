import {dialogUtils, effectUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let charmed = effectUtils.getEffectByStatusID(workflow.actor, 'charmed');
    let frightened = effectUtils.getEffectByStatusID(workflow.actor, 'frightened');
    if (!charmed && !frightened) return;
    if (charmed && frightened) {
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.StillnessOfMind.Select', [
            [charmed.name, 'charmed'],
            [frightened.name, 'frightened']
        ]);
        if (!selection) return;
        if (selection === 'charmed') await genericUtils.remove(charmed);
        if (selection === 'frightened') await genericUtils.remove(frightened);
        return;
    }
    if (charmed) await genericUtils.remove(charmed);
    if (frightened) await genericUtils.remove(frightened);
}
export let stillnessOfMind = {
    name: 'Stillness of Mind',
    version: '0.12.46',
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