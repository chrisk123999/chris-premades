import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRoll) return;
    let itemType = workflow.item.type;
    if (!(itemType === 'weapon' || (itemType === 'spell' && workflow.castData.castLevel === 0))) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'blessedStrikes');
    if (!originItem) return;
    if (originItem.flags['chris-premades']?.blessedStrikes?.used) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    let damageType = itemUtils.getConfig(originItem, 'damageType');
    await workflowUtils.bonusDamage(workflow, '1d8[radiant]', {damageType});
    await genericUtils.setFlag(originItem, 'chris-premades', 'blessedStrikes.used', true);
}
async function turnStart({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'blessedStrikes.used', false);
}
export let blessedStrikes = {
    name: 'Blessed Strikes',
    version: '0.12.37',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        }
    ]
};