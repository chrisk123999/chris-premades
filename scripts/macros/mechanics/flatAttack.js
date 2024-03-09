import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function menu(item) {
    let attackBonus = item.flags['chris-premades']?.attackRoll?.value ?? '';
    let enabled = item.flags['chris-premades']?.attackRoll?.enabled ?? false;
    let inputs = [
        {
            'label': 'Flat Attack Bonus:',
            'type': 'number',
            'options': attackBonus
        },
        {
            'label': 'Enabled:',
            'type': 'checkbox',
            'options': enabled
        }
    ];
    let selection = await chris.menu('Flat Attack Bonus', constants.okCancel, inputs, true);
    if (!selection.buttons) return;
    await item.setFlag('chris-premades', 'attackRoll', {'enabled': selection.inputs[1], 'value': selection.inputs[0]});
}
async function attack(workflow) {
    if (!workflow.item || !workflow.attackRoll) return;
    let attackRoll = workflow.item.flags['chris-premades']?.attackRoll;
    if (!attackRoll) return;
    if (!attackRoll.enabled || !attackRoll.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'flatAttack', 10);
    if (!queueSetup) return;
    let formula = '1d20 + ' + attackRoll.value;
    let bonus = workflow.actor.system.bonuses[workflow.item.system.actionType]?.attack;
    if (bonus && bonus != '') formula += bonus;
    let roll = await new Roll(formula, workflow.actor.getRollData()).evaluate({'async': true});
    await workflow.setAttackRoll(roll);
    queue.remove(workflow.item.uuid);
}
export let flatAttack = {
    'attack': attack,
    'menu': menu
}