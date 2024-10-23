import {genericUtils, rollUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let roll = await rollUtils.rollDice('1d100');
    await roll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name + ': ' + (roll.total < 95 ? genericUtils.translate('CHRISPREMADES.Generic.Failure') : genericUtils.translate('CHRISPREMADES.Generic.Success'))
    });
    if (roll.total < 95) return;
    if (workflow.item.system.quantity > 1) {
        await genericUtils.update(workflow.item, {'system.quantity': workflow.item.system.quantity - 1});
    } else {
        await genericUtils.remove(workflow.item);
    }
}
export let mysteryKey = {
    name: 'Mystery Key',
    version: '1.0.28',
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