import {chris} from '../../../../helperFunctions.js';
export async function inspiringSmite({speaker, actor, token, character, item, args, scope, workflow}) {
    let targets = await chris.findNearby(workflow.token, 30, 'ally');
    if (workflow.token) targets.push(workflow.token);
    if (targets.length === 0) return;
    let classLevels = workflow.actor.classes.paladin?.system.levels;
    if (!classLevels) return;
    let rollFormula = '2d8[temphp] + ' + classLevels;
    let damageRoll = await new Roll(String(rollFormula)).evaluate({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    let buttons = [
        {
            'label': 'Ok',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    let selection = await chris.selectTarget('Who is getting healing? (Max: ' + damageRoll.total + ')', buttons, targets, null, 'number');
    if (!selection.buttons) return;
    let total = 0;
    for (let i of selection.inputs) {
        if (!isNaN(i)) total += i;
    }
    if (total > damageRoll.total) {
        ui.notifications.info('You can\'t heal that much!');
        return;
    }
    let count = 0;
    for (let i of targets) {
        if (!isNaN(selection.inputs[count])) {
            await chris.applyDamage([i], selection.inputs[count], 'temphp');
            new Sequence().effect().atLocation(i).file('jb2a.cure_wounds.400px.blue').play();
        }
        count++;
    }
}