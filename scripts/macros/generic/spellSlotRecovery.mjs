import {actorUtils, automationUtils, dialogUtils, Logging, rollUtils, workflowUtils} from '../../proxy.mjs';
export async function recoverSlots(workflow, formula, maxSlotLevel) {
    const {activity, actor} = workflow;
    if (!Object.values(actor.system.spells).some(slot => slot.max > 0 && slot.value < slot.max)) {
        await workflowUtils.refundUse(workflow);
        Logging.addMacroWarning('chris-premades', activity.item.name, 'No expended spell slots.');
        return;
    }
    const totalSlots = (await rollUtils.rollDice(formula, {document: activity})).total;
    const selection = await dialogUtils.selectSpellSlots(actor, activity.item.name, _loc('CHRISPREMADES.Macros.Modern.ArcaneRecovery.Context', {totalSlots}), {
        maxLevel: maxSlotLevel,
        maxAmount: totalSlots,
        recover: true
    });
    if (!selection?.length) {
        await workflowUtils.refundUse(workflow);
        return;
    }
    await Promise.all(selection.map(slot => actorUtils.recoverSpellSlots(actor, slot.key, {amount: slot.amount})));
}
async function use({document: activity, workflow}) {
    if (workflow.activity?.uuid !== activity.uuid) return;
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'spellSlotRecovery', configKeys);
    if (!config.formula) return;
    await recoverSlots(workflow, config.formula, config.maxSlotLevel);
}
/**
 * Lets the user pick expended spell slots to recover once the activity's roll finishes, up to a total number of slot
 * levels and no higher than a maximum slot level.
 */
export const spellSlotRecovery = {
    rules: 'all',
    version: '2.1.11',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        formula: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.SpellSlotRecovery.Formula.Hint'
        },
        maxSlotLevel: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxLevel',
            hint: 'CHRISPREMADES.Macros.Generic.SpellSlotRecovery.MaxSlotLevel.Hint'
        }
    }
};
const configKeys = Object.keys(spellSlotRecovery.genericConfig);
