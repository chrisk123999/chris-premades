import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRoll) return;
    let itemType = workflow.item.type;
    if (!(itemType === 'weapon' || (itemType === 'spell' && workflowUtils.getCastLevel(workflow) === 0))) return;
    if (item.flags['chris-premades']?.blessedStrikes?.used) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let damageType = itemUtils.getConfig(item, 'damageType');
    await workflowUtils.bonusDamage(workflow, '1d8[radiant]', {damageType});
    if (combatUtils.inCombat()) await genericUtils.setFlag(item, 'chris-premades', 'blessedStrikes.used', true);
    await item.use();
}
async function clearUsed({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'blessedStrikes.used', false);
}
export let blessedStrikes = {
    name: 'Blessed Strikes',
    version: '1.1.0',
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
            macro: clearUsed,
            priority: 50
        },
        {
            pass: 'combatEnd',
            macro: clearUsed,
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