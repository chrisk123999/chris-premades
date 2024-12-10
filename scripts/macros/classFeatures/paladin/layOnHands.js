import {DialogApp} from '../../../applications/dialog.js';
import {activityUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';

// async function late({workflow}) {
//     if (!workflow.targets.size) return;
//     let uses = workflow.item.system.uses.value;
//     if (!uses) {
//         genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.LayOnHands.Empty', {itemName: workflow.item.name}), 'info');
//         return;
//     }
//     let targetToken = workflow.targets.first();
//     let inputs = [
//         ['selectOption',
//             [
//                 {
//                     label: 'CHRISPREMADES.Macros.LayOnHands.RemoveCondition',
//                     name: 'condition',
//                     options: {
//                         options: [
//                             {
//                                 value: 'none',
//                                 label: 'DND5E.None'
//                             }
//                         ]
//                     }
//                 }
//             ]
//         ],
//         ['number',
//             [
//                 {
//                     label: 'CHRISPREMADES.Macros.LayOnHands.RestoreHitpoints',
//                     name: 'restore'
//                 }
//             ]
//         ]
//     ];
//     let diseased = effectUtils.getEffectByStatusID(targetToken.actor, 'diseased');
//     if (diseased && uses >= 5) inputs[0][1][0].options.options.push({
//         value: 'diseased',
//         label: diseased.name
//     });
//     let poisoned = effectUtils.getEffectByStatusID(targetToken.actor, 'poisoned');
//     if (poisoned && uses >= 5) inputs[0][1][0].options.options.push({
//         value: 'poisoned',
//         label: poisoned.name
//     });
//     let selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.LayOnHands.Select', inputs, 'okCancel');
//     if (!selection?.buttons) return;
//     let {condition, restore} = selection;
//     if (condition === 'diseased') {
//         await genericUtils.remove(diseased);
//         uses -= 5;
//     } else if (condition === 'poisoned') {
//         await genericUtils.remove(poisoned);
//         uses -= 5;
//     }
//     let numToHeal = Math.min(uses, restore);
//     if (numToHeal <= 0) {
//         await workflowUtils.replaceDamage(workflow, '0');
//     } else {
//         await workflowUtils.replaceDamage(workflow, numToHeal + '[healing]', {damageType: 'healing'});
//         uses -= numToHeal;
//     }
//     await genericUtils.update(workflow.item, {'system.uses.value': uses});
// }
function early({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    let poisoned = effectUtils.getEffectByStatusID(targetToken.actor, 'poisoned');
    let diseased = effectUtils.getEffectByStatusID(targetToken.actor, 'diseased');
    if (activityIdentifier === 'layOnHandsPoison' && !poisoned) {
        genericUtils.notify('CHRISPREMADES.Macros.LayOnHands.TargetNotPoisoned', 'info');
        return true;
    }
    if (activityIdentifier === 'layOnHandsDisease' && !diseased) {
        genericUtils.notify('CHRISPREMADES.Macros.LayOnHands.TargetNotDiseased', 'info');
        return true;
    }
}
async function late({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    if (activityIdentifier === 'layOnHandsPoison') {
        let poisoned = effectUtils.getEffectByStatusID(targetToken.actor, 'poisoned');
        if (poisoned) await genericUtils.remove(poisoned);
        return;
    }
    if (activityIdentifier === 'layOnHandsDisease') {
        let diseased = effectUtils.getEffectByStatusID(targetToken.actor, 'diseased');
        if (diseased) await genericUtils.remove(diseased);
        return;
    }
}
export let layOnHands = {
    name: 'Lay on Hands',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['layOnHandsPoison', 'layOnHandsDisease']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
            // {
            //     pass: 'damageRollComplete',
            //     macro: late,
            //     priority: 50
            // }
        ]
    },
    ddbi: {
        correctedItems: {
            'Lay on Hands Pool': {
                system: {
                    uses: {
                        prompt: false
                    }
                }
            }
        },
        renamedItems: {
            'Lay on Hands Pool': 'Lay on Hands'
        }
    }
};