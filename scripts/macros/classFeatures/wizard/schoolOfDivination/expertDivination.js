import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== 'div') return;
    let level = workflow.spellLevel;
    if (!level || level < 2) return;
    let buttons = [];
    for(let i = 1; i < Math.min(6, level); i++) {
        if (workflow.actor.system.spells['spell' + i].value < workflow.actor.system.spells['spell' + i].max) {
            buttons.push(['DND5E.SpellLevel' + i, i]);
        }
    }
    if (!buttons.length) return;
    let slot = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.ExpertDivination.Select', buttons);
    if (!slot) return;
    await genericUtils.update(workflow.actor, {['system.spells.spell' + slot + '.value']: workflow.actor.system.spells['spell' + slot].value + 1});
    let extraDescription = '\n<hr><p>' + genericUtils.format('CHRISPREMADES.Macros.BolsteringMagic.SlotRegained', {slotLevel: slot}) + '</p>';
    let tempItem = item.clone({'system.description.value': item.system.description.value + extraDescription, 'system.description.chat': item.system.description.chat ? item.system.description.chat + extraDescription : ''});
    await workflowUtils.syntheticItemRoll(tempItem, []);
}
export let expertDivination = {
    name: 'Expert Divination',
    version: '0.12.62',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};