import {actorUtils, automationUtils, documentUtils, genericUtils, itemUtils, Logging, rollUtils} from '../../../../proxy.mjs';
async function addWish({document: activity, data}) {
    return {source: activity, identifier: 'wish'};
}
async function applyCooldown({workflow, identifier}) {
    const divineIntervention = actorUtils.getItemByIdentifier(workflow.actor, 'divine-intervention');
    if (!divineIntervention) return;
    const formula = automationUtils.getConfigValue(workflow.item, 'restFormula');
    const {roll} = await rollUtils.rollDice(formula, {document: workflow.activity, message: true, flavor: workflow.item.name});
    const effectId = workflow.item.effects.contents[0]?.id;
    if (!effectId) return Logging.addMacroWarning('chris-premades', identifier, `${workflow.item.name} is missing an enchantment for the long rest mechanic!`);
    const effectData = documentUtils.getEffectData(workflow.item, effectId);
    genericUtils.setProperty(effectData, 'flags.chris-premades.greaterDivineInterventionRest.value', roll.total - 1);
    await itemUtils.enchantItem(divineIntervention, effectData);
}
async function rest({document}) {
    const restsLeft = document.flags['chris-premades']?.greaterDivineInterventionRest?.value;
    if (!restsLeft || restsLeft === 1) {
        await documentUtils.deleteDocument(document);
    } else {
        await documentUtils.setFlag(document, 'chris-premades', 'greaterDivineInterventionRest.value', restsLeft - 1);
    }
}
export const greaterDivineIntervention = {
    name: 'Greater Divine Intervention',
    version: '2.0.3',
    rules: '2024',
    called: [
        {
            pass: 'actorDivineIntervention',
            macro: addWish,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: applyCooldown,
            priority: 50
        }
    ],
    config: {
        restFormula: {
            default: '2d4',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.GreaterDivineIntervention.RestFormula',
            category: 'homebrew'
        }
    }
};
export const greaterDivineInterventionRest = {
    name: 'Divine Intervention: Blocked',
    version: '2.0.0',
    rules: '2024',
    rest: [
        {
            pass: 'actorLong',
            macro: rest,
            priority: 50
        }
    ]
};
