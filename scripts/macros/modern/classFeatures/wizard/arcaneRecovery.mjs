import {automationUtils} from '../../../../proxy.mjs';
import {recoverSlots} from '../../../generic/spellSlotRecovery.mjs';
async function use({workflow}) {
    const formula = automationUtils.getConfigValue(workflow.item, 'formula');
    const bonuses = await automationUtils.calledEvent('arcaneRecoveryBonus', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow}}) ?? [];
    const bonus = bonuses.reduce((total, value) => total + (value.bonus ?? 0), 0);
    await recoverSlots(workflow, formula + ' + ' + bonus, automationUtils.getConfigValue(workflow.item, 'maxSlotLevel') ?? 5);
}
export const arcaneRecovery = {
    name: 'Arcane Recovery',
    version: '2.1.11',
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
            type: 'formula',
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
