import {constants, genericUtils, workflowUtils} from '../../../../utils.js';
async function late({trigger: {entity: effect}, workflow}) {
    if (!(constants.attacks.includes(workflowUtils.getActionType(workflow)) || workflow.item.system.save.ability || workflow.damageRoll)) return;
    if (effect) await genericUtils.remove(effect);
}
export let hiddenStep = {
    name: 'Hidden Step',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};