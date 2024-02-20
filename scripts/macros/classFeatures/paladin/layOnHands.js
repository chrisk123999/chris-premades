import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
export async function layOnHands({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let uses = workflow.item.system.uses.value;
    let queueSetup = await queue.setup(workflow.item.uuid, 'layOnHands', 50);
    if (!queueSetup) return;
    if (!uses) {
        ui.notifications.info('Your ' + workflow.item.name + ' pool is empty.');
        await workflow.setDamageRolls([]);
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetToken = workflow.targets.first();
    let inputs = [
        {
            'label': 'Remove a Condition: ',
            'type': 'select',
            'options': [
                {
                    'html': 'None',
                    'value': false,
                    'default': true
                }
            ]
        },
        {
            'label': 'Restore Hitpoints:',
            'type': 'number'
        }
    ];
    let diseased = chris.findEffect(targetToken.actor, translate.conditions('diseased'));
    let poisoned = chris.findEffect(targetToken.actor, translate.conditions('poisoned'));
    if (diseased && uses >= 5) inputs[0].options.push({'html': diseased.name, 'value': 'diseased'});
    if (poisoned && uses >= 5) inputs[0].options.push({'html': poisoned.name, 'value': 'poisoned'});
    let selection = await chris.menu(workflow.item.name, constants.okCancel, inputs, true);
    if (!selection.buttons) {
        await workflow.setDamageRolls([]);
        queue.remove(workflow.item.uuid);
        return;
    }
    switch(selection.inputs[0]) {
        case 'diseased':
            await chris.removeEffect(diseased);
            await workflow.setDamageRolls([]);
            await workflow.item.update({'system.uses.value': uses - 5});
            break;
        case 'poisoned':
            await chris.removeEffect(poisoned);
            await workflow.setDamageRolls([]);
            await workflow.item.update({'system.uses.value': uses - 5});
            break;
        default:
            let number = selection.inputs[1];
            if (number <= uses && !isNaN(number)) {
                let damageRoll = await chris.damageRoll(workflow, number + '[' + translate.healingType('healing') + ']');
                await workflow.setDamageRolls([damageRoll]);
                await workflow.item.update({'system.uses.value': uses - number});
            } else {
                ui.notifications.info('Invalid Entry!');
                await workflow.setDamageRolls([]);
            }
            break;
    }
    queue.remove(workflow.item.uuid);
}