import {actorUtils, automationUtils, dialogUtils, rollUtils} from '../../../../proxy.mjs';
async function use({workflow}) {
    if (!Object.values(workflow.actor.system.spells).some(s => s.max > 0 && s.value < s.max)) return;
    const formula = automationUtils.getConfigValue(workflow.item, 'formula');
    const bonuses = await automationUtils.calledEvent('arcaneRecoveryBonus', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow}}) ?? [];
    const bonus = bonuses.reduce((total, value) => total + (value.bonus ?? 0), 0);
    const totalSlots = (await rollUtils.rollDice(formula + ' + ' + bonus, {document: workflow.activity})).total;
    const maxSlotLevel = automationUtils.getConfigValue(workflow.item, 'maxSlotLevel') ?? 5;
    const selection = await dialogUtils.selectSpellSlots(workflow.actor, workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.ArcaneRecovery.Context', {totalSlots}), {
        maxLevel: maxSlotLevel,
        maxAmount: totalSlots,
        recover: true
    });
    if (!selection?.length) return;
    await Promise.all(selection.map(s => actorUtils.recoverSpellSlots(workflow.actor, s.key, {amount: s.amount})));
}
export const arcaneRecovery = {
    name: 'Arcane Recovery',
    version: '2.0.0',
    rules: '2024',
    notes: 'Use the "actorArcaneRecoveryBonus" called event (async) to modify the number of spell slots that can be recovered.\n\tData available: workflow.',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: 'ceil(@classes.wizard.levels / 2)',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        maxSlotLevel: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.MaxLevel',
            category: 'homebrew'
        }
    }
};
