import {chris} from '../../../../helperFunctions.js';
export async function preserveLife({speaker, actor, token, character, item, args, scope, workflow}) {
    let targets = await chris.findNearby(workflow.token, 30, 'ally', true);
    if (workflow.token) targets.push(workflow.token);
    if (targets.length === 0) return;
    let classLevels = workflow.actor.classes.cleric?.system.levels;
    if (!classLevels) return;
    let maxHeal = classLevels * 5;
    let buttons = [
        {
            'label': 'Ok',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    let selection = await chris.selectTarget('Who is getting healing? (Max: ' + maxHeal + ')', buttons, targets, null, 'number');
    if (!selection.buttons) return;
    let total = 0;
    for (let i of selection.inputs) {
        if (!isNaN(i)) total += i;
    }
    if (total > maxHeal) {
        ui.notifications.info('You can\'t heal that much!');
        return;
    }
    let count = 0;
    for (let i of targets) {
        if (!isNaN(selection.inputs[count])) {
            let currentHP = i.actor.system.attributes.hp.value;
            let maxHPHalf = Math.floor(i.actor.system.attributes.hp.max / 2);
            let healing = selection.inputs[count];
            if (currentHP >= maxHPHalf) continue;
            if (currentHP + healing > maxHPHalf) {
                healing = maxHPHalf - currentHP;
            }
            await chris.applyDamage([i], healing, 'healing');
            new Sequence().effect().atLocation(i).file('jb2a.cure_wounds.400px.blue').play();
        }
        count++;
    }
}