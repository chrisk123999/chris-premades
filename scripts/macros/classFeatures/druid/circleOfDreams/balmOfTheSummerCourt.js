import {DialogApp} from '../../../../applications/dialog.js';
import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (!workflow.targets.size) return;
    let uses = workflow.item.system.uses.value;
    if (!uses) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.LayOnHands.Empty', {itemName: workflow.item.name}), 'info');
        return;
    }
    let classLevels = workflow.actor.classes.druid?.system.levels;
    if (!classLevels) return;
    let maxAmount = Math.min(uses, Math.floor(classLevels / 2));
    let inputs = [
        ['selectAmount',
            [
                {
                    label: 'CHRISPREMADES.Macros.BalmOfTheSummerCourt.Num',
                    name: 'num',
                    options: {
                        maxAmount
                    }
                }
            ]
        ]
    ];
    let selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.BalmOfTheSummerCourt.Select', inputs, 'okCancel');
    if (!selection.buttons) return;
    let number = Number(selection.num);
    if (isNaN(number)) {
        genericUtils.notify('CHRISPREMADES.Dialog.Invalid', 'warn');
        return;
    }
    await workflowUtils.replaceDamage(workflow, number + 'd6[healing]', {damageType: 'healing'});
    await workflowUtils.bonusDamage(workflow, number + '[temphp]', {damageType: 'temphp'});
    await genericUtils.update(workflow.item, {'system.uses.spent': workflow.item.system.uses.spent + number});
}
export let balmOfTheSummerCourt = {
    name: 'Balm of the Summer Court',
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