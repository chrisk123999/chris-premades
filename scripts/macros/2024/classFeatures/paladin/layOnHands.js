import {effectUtils, genericUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let poisoned = effectUtils.getEffectByStatusID(workflow.targets.first().actor, 'poisoned');
    if (poisoned) await genericUtils.remove(poisoned);
}
export let layOnHands = {
    name: 'Lay On Hands',
    aliases: ['Lay on Hands'],
    version: '1.3.147',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['poison']
            }
        ]
    }
};