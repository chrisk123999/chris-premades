import {chris} from '../../../../helperFunctions.js';
export async function spellRefuelingRing({speaker, actor, token, character, item, args, scope, workflow}) {
    let pact = workflow.actor.system.spells.pact.value;
    let pactMax = workflow.actor.system.spells.pact.max;
    let pactLevel = workflow.actor.system.spells.pact.level;
    let spell1 = workflow.actor.system.spells.spell1.value;
    let spell1Max = workflow.actor.system.spells.spell1.max;
    let spell2 = workflow.actor.system.spells.spell2.value;
    let spell2Max = workflow.actor.system.spells.spell2.max;
    let spell3 = workflow.actor.system.spells.spell3.value;
    let spell3Max = workflow.actor.system.spells.spell3.max;
    let options = [];
    if (pactLevel <= 3 && pactMax > pact) options.push(['Pact', 'pact']);
    if (spell1Max > spell1) options.push(['First Level', 'spell1']);
    if (spell2Max > spell2) options.push(['2nd Level', 'spell2']);
    if (spell3Max > spell3) options.push(['3rd Level', 'spell3']);
    if (!options.length) {
        ui.notifications.info('No spell slots to recover!');
        return;
    }
    let selection;
    if (options.length === 1) selection = options[0][1];
    if (!selection) selection = await chris.dialog(workflow.item.name, options, 'What spell slot do you want to recover?');
    if (!selection) return;
    let key = 'system.spells.' + selection + '.value';
    let value = getProperty(workflow.actor.system.spells, selection + '.value');
    await workflow.actor.update({[key]: value + 1});
}