import {chris} from '../../../../helperFunctions.js';
export async function expertDivination({speaker, actor, token, character, item, args, scope, workflow}) {
    let type = workflow.item.type;
    if (type != 'spell') return;
    let school = workflow.item.system.school;
    if (school != 'div') return;
    let level = workflow.item.system.level;
    if (level < 2) return;
    let missingFirst = workflow.actor.system.spells.spell1.max - workflow.actor.system.spells.spell1.value;
    let missingSecond = workflow.actor.system.spells.spell2.max - workflow.actor.system.spells.spell2.value;
    let missingThird = workflow.actor.system.spells.spell3.max - workflow.actor.system.spells.spell3.value;
    let missingFourth = workflow.actor.system.spells.spell4.max - workflow.actor.system.spells.spell4.value;
    let missingFifth = workflow.actor.system.spells.spell5.max - workflow.actor.system.spells.spell5.value;
    let menu = [];
    if (level > 1 && missingFirst > 0) menu.push(['1st Level', 1]);
    if (level > 2 && missingSecond > 0) menu.push(['2nd Level', 2]);
    if (level > 3 && missingThird > 0) menu.push(['3rd Level', 3]);
    if (level > 4 && missingFourth > 0) menu.push(['4th Level', 4]);
    if (level > 5 && missingFifth > 0) menu.push(['5th Level', 5]);
    if (menu.length === 0) return;
    let slot = await chris.dialog('What level spell slot do you want to regain?', menu);
    if (!slot) return;
    let updateString;
    let updateValue;
    let messageString;
    switch (slot) {
        case 1:
            updateString = 'system.spells.spell1.value';
            updateValue = workflow.actor.system.spells.spell1.value + 1;
            messageString = 'Regained a 1st level spell slot!'
            break;
        case 2:
            updateString = 'system.spells.spell2.value';
            updateValue = workflow.actor.system.spells.spell2.value + 1;
            messageString = 'Regained a 2nd level spell slot!'
            break;
        case 3:
            updateString = 'system.spells.spell3.value';
            updateValue = workflow.actor.system.spells.spell3.value + 1;
            messageString = 'Regained a 3rd level spell slot!'
            break;
        case 4:
            updateString = 'system.spells.spell4.value';
            updateValue = workflow.actor.system.spells.spell4.value + 1;
            messageString = 'Regained a 4th level spell slot!'
            break;
        case 5:
            updateString = 'system.spells.spell5.value';
            updateValue = workflow.actor.system.spells.spell5.value + 1;
            messageString = 'Regained a 5th level spell slot!'
            break;
    }
    workflow.actor.update({[updateString]: updateValue});
    let effect = chris.findEffect(workflow.actor, 'Expert Divination');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    let tempItem = duplicate(originItem.toObject());
    tempItem.system.description.value = tempItem.system.description.value + '\n<hr><p>' + messageString + '</p>'
    let feature = new CONFIG.Item.documentClass(tempItem, {parent: workflow.actor});
    await feature.use();
}