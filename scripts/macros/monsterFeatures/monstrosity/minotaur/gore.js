import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let charge = itemUtils.getItemByIdentifier(workflow.actor, 'minotaurCharge');
    if (!charge) return;
    let selection = await dialogUtils.confirm(charge.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: charge.name}));
    if (!selection) return;
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    await workflowUtils.bonusDamage(workflow, formula + '[' + damageType + ']', {damageType: damageType});
    await workflowUtils.syntheticItemRoll(charge, Array.from(workflow.targets));
}
export let minotaurGore = {
    name: 'Gore',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'piercing',
            category: 'mechanics',
            options: constants.damageTypeOptions
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d8',
            category: 'mechanics'
        }
    ],
    monster: [
        'Minotaur'
    ]
};