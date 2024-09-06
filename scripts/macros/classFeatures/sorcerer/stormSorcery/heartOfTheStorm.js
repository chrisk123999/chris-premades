import {dialogUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell' || workflow.item.system.level === 0) return;
    let damageParts = workflow.item.system.damage.parts;
    if (!damageParts.some(i => ['lightning', 'thunder'].some(j => i[0].includes(j) || i[1] === j))) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'heartOfTheStorm');
    if (!originItem) return;
    await workflowUtils.completeItemUse(originItem);
}
async function damage({workflow}) {
    if (!workflow.targets.size) return;
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
        ['DND5E.DamageLightning', 'lightning'],
        ['DND5E.DamageThunder', 'thunder']
    ]);
    if (!damageType) damageType = 'lightning';
    await workflowUtils.replaceDamage(workflow, workflow.item.system.damage.parts[0][0], {damageType});
}
export let heartOfTheStorm = {
    name: 'Heart of the Storm',
    version: '0.12.58',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};