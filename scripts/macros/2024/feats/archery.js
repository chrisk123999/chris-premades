import {constants, workflowUtils} from '../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !constants.rangedWeaponTypes.includes(workflow.item.system.type.value)) return; 
    await workflowUtils.bonusAttack(workflow, 2);
}

export let archery = {
    name: 'Archery',
    version: '1.2.36',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 200
            }
        ]
    }
};