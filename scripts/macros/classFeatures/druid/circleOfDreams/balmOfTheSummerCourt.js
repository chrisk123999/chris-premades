import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
export async function balmOfTheSummerCourt({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let uses = workflow.item.system.uses.value;
    let queueSetup = await queue.setup(workflow.item.uuid, 'balmOfTheSummerCourt', 50);
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
            'label': 'How Many Balms?:',
            'type': 'number'
        }
    ];
    let selection = await chris.menu(workflow.item.name, constants.okCancel, inputs, true);
    if (!selection.buttons) {
        await workflow.setDamageRolls([]);
        queue.remove(workflow.item.uuid);
        return;
    }
    let number = selection.inputs[1];
    let classLevels = workflow.actor.classes.druid?.system.levels;
    let max = math.min(uses, classLevels);
    if (number <= max && !isNaN(number)) {
        let damageRoll = await chris.damageRoll(workflow, number + 'd6[' + translate.healingType('healing') + ']');
        let tempDamageRoll = await chris.damageRoll(workflow, number + '[' + translate.healingType('temphp') + ']');
        await workflow.setDamageRolls([damageRoll, tempDamageRoll]);
        await workflow.item.update({'system.uses.value': uses - number});
    } else {
        ui.notifications.info('Invalid Entry!');
        await workflow.setDamageRolls([]);
    }

    queue.remove(workflow.item.uuid);
}
