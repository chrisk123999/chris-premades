import {actorUtils, automationUtils, constants, dialogUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document: item, workflow}) {
    if (workflow.item.type !== 'spell') return;
    const school = automationUtils.getConfigValue(item, 'school');
    if (workflow.item.system.school !== school) return;
    const level = workflowUtils.getCastLevel(workflow);
    if (!level || level < 2) return;
    if (workflowUtils.isSustainedRoll(workflow)) return;
    const maxSlotLevel = automationUtils.getConfigValue(item, 'maxSlotLevel') ?? 5;
    const buttons = [];
    for (let i = 1; i < Math.min(maxSlotLevel + 1, level); i++) {
        if (workflow.actor.system.spells['spell' + i].value < workflow.actor.system.spells['spell' + i].max) {
            buttons.push(['DND5E.SpellLevel' + i, i]);
        }
    }
    if (!buttons.length) return;
    const slot = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.ExpertDivination.Select', buttons);
    if (!slot) return;
    await actorUtils.recoverSpellSlots(workflow.actor, slot);
    const extraDescription = '\n<hr><p>' + _loc('CHRISPREMADES.Macros.Legacy.ExpertDivination.SlotRegained', {slotLevel: slot}) + '</p>';
    const tempItem = item.clone({'system.description.value': item.system.description.value + extraDescription, 'system.description.chat': item.system.description.chat ? item.system.description.chat + extraDescription : ''});
    await workflowUtils.syntheticItemRoll(tempItem, []);
}
export const expertDivination = {
    name: 'Expert Divination',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        maxSlotLevel: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.ExpertDivination.MaxSlotLevel',
            category: 'homebrew'
        },
        school: {
            default: 'div',
            type: 'select',
            label: 'CHRISPREMADES.Config.SpellSchool',
            category: 'mechanics',
            get options() { return constants.spellSchoolOptions; }
        }
    }
};
