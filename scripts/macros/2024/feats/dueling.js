import {constants, genericUtils, workflowUtils} from '../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || workflow.attackMode === 'twoHanded') return;
    let actor = workflow.actor;
    let items = actor.items.filter(i => i.system.equipped && i.type === 'weapon' && !constants.unarmedAttacks.includes(genericUtils.getIdentifier(i)));
    if (items.length > 1) return;
    await workflowUtils.bonusDamage(workflow, 2);
}

export let dueling = {
    name: 'Dueling',
    version: '1.2.36',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 200
            }
        ]
    }
};