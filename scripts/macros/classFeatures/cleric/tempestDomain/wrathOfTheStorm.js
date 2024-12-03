import {dialogUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', [
        ['DND5E.DamageLightning', 'lightning'],
        ['DND5E.DamageThunder', 'thunder']
    ]);
    if (!selection) selection = 'lightning';
    await workflowUtils.replaceDamage(workflow, workflow.damageRoll.formula, {damageType: selection});
}
export let wrathOfTheStorm = {
    name: 'Wrath of the Storm',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};