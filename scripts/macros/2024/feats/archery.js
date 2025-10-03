import {constants, itemUtils, workflowUtils} from '../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !constants.rangedWeaponTypes.includes(workflow.item.system.type?.value)) return;
    let bonus = itemUtils.getConfig(item, 'bonus');
    await workflowUtils.bonusAttack(workflow, bonus);
}

export let archery = {
    name: 'Archery',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 200
            }
        ]
    },
    config: [
        {
            value: 'bonus',
            label: 'CHRISPREMADES.Config.AttackBonus',
            type: 'text',
            default: '2',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};