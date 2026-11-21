import {automationUtils, dialogUtils, documentUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function helpedAlly({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflow.item.type !== 'spell' || workflowUtils.isSustainedRoll(workflow)) return;
    const config = automationUtils.getConfigValues(activity.item, Object.keys(dispellingRecovery.config));
    if (!config.prompt) return;
    const id = documentUtils.getIdentifier(workflow.item);
    const exception = config.identifiers.length && config.identifiers.includes(id);
    if (!workflowUtils.getDamageTypes(workflow.damageRolls ?? []).has('healing') && !exception) return;
    if (!activity.item.system.uses.value)
        return Logging.addMacroWarning(source, identifier, `Dispelling Recovery exited early without item uses. (activity) ${activity.uuid}`);
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity);
}
export const dispellingRecovery = {
    name: 'Dispelling Recovery',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: helpedAlly,
            priority: 200
        }
    ],
    config: {
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        },
        identifiers: {
            default: ['greater-restoration', 'lesser-restoration'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CAT.MEDKIT.Activity.SpellIdentifier.Label',
            hint: 'CHRISPREMADES.Macros.Modern.DispellingRecovery'
        }
    }
};
