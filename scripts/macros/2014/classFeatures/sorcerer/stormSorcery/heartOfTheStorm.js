import {dialogUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function early({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell' || workflow.item.system.level === 0) return;
    let damageParts = workflow.activity.damage.parts;
    if (!damageParts.some(i => ['lightning', 'thunder'].some(j => i.custom?.formula?.includes(j) || i.types.has(j)))) return;
    await workflowUtils.completeItemUse(item, {}, {configureDialog: false});
}
async function damage({workflow}) {
    if (!workflow.targets.size) return;
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
        ['DND5E.DamageLightning', 'lightning'],
        ['DND5E.DamageThunder', 'thunder']
    ]);
    if (!damageType) damageType = 'lightning';
    await workflowUtils.replaceDamage(workflow, workflow.activity.damage.parts[0].formula, {damageType});
}
export let heartOfTheStorm = {
    name: 'Heart of the Storm',
    version: '1.1.0',
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