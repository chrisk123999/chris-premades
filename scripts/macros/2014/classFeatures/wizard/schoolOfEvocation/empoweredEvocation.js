import {workflowUtils} from '../../../../../utils.js';

async function damage({workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== 'evo') return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, '@abilities.int.mod', {damageType});
}
export let empoweredEvocation = {
    name: 'Empowered Evocation',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};