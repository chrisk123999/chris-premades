import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function divineSmite({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.name === 'Unarmed Strike' && !game.settings.get('chris-premades', 'Unarmed Strike Smite')) return;
    let validTypes = ['martialM', 'simpleM'];
    if (game.settings.get('chris-premades', 'Ranged Smite')) {
        validTypes.push('martialR');
        validTypes.push('simpleR');
    }
    if (!validTypes.includes(workflow.item.system.type.value)) return;
    let feature = chris.getItem(workflow.actor, 'Divine Smite');
    if (!feature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'divineSmite', 250);
    if (!queueSetup) return;
    let spells = workflow.actor.system.spells;
    let pactSlots = spells.pact.value;
    let pactLevel = spells.pact.level;
    let spell1 = spells.spell1.value;
    let spell2 = spells.spell2.value;
    let spell3 = spells.spell3.value;
    let spell4 = spells.spell4.value;
    let spell5 = spells.spell5.value;
    let spell6 = spells.spell6.value;
    let spell7 = spells.spell7.value;
    let spell8 = spells.spell8.value;
    let spell9 = spells.spell9.value;
    if (pactSlots + spell1 + spell2 + spell3 + spell4 + spell5 + spell6 + spell7 + spell8 + spell9 === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let menuOptions = [];
    if (pactSlots > 0) menuOptions.push(['Pact (' + pactLevel + ')', 'p']);
    if (spell1 > 0) menuOptions.push(['1st Level', 1]);
    if (spell2 > 0) menuOptions.push(['2nd Level', 2]);
    if (spell3 > 0) menuOptions.push(['3rd Level', 3]);
    if (spell4 > 0) menuOptions.push(['4th Level', 4]);
    if (spell5 > 0) menuOptions.push(['5th Level', 5]);
    if (spell6 > 0) menuOptions.push(['6th Level', 6]);
    if (spell7 > 0) menuOptions.push(['7th Level', 7]);
    if (spell8 > 0) menuOptions.push(['8th Level', 8]);
    if (spell9 > 0) menuOptions.push(['9th Level', 9]);
    menuOptions.push(['No', false]);
    let selectedOption = await chris.dialog(feature.name, menuOptions, 'Use ' + feature.name + '?');
    if (!selectedOption) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let update = {};
    let damageDiceNum;
    switch (selectedOption) {
        case 'p':
            update = {'system.spells.pact.value': pactSlots - 1};
            damageDiceNum = pactLevel + 1;
            break;
        case 1:
            update = {'system.spells.spell1.value': spell1 - 1};
            damageDiceNum = 2;
            break;
        case 2:
            update = {'system.spells.spell2.value': spell2 - 1};
            damageDiceNum = 3;
            break;
        case 3:
            update = {'system.spells.spell3.value': spell3 - 1};
            damageDiceNum = 4;
            break;
        case 4:
            update = {'system.spells.spell4.value': spell4 - 1};
            damageDiceNum = 5;
            break;
        case 5:
            update = {'system.spells.spell5.value': spell5 - 1};
            damageDiceNum = 5;
            break;
        case 6:
            update = {'system.spells.spell6.value': spell6 - 1};
            damageDiceNum = 5;
            break;
        case 7:
            update = {'system.spells.spell7.value': spell7 - 1};
            damageDiceNum = 5;
            break;
        case 8:
            update = {'system.spells.spell8.value': spell8 - 1};
            damageDiceNum = 5;
            break;
        case 9:
            update = {'system.spells.spell9.value': spell9 - 1};
            damageDiceNum = 5;
            break;
    }
    await workflow.actor.update(update);
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let type = chris.raceOrType(targetActor);
    if (type === 'undead' || type === 'fiend') damageDiceNum += 1;
    let bonusDamageFormula = damageDiceNum + 'd8[radiant]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    await feature.displayCard();
    queue.remove(workflow.item.uuid);
}