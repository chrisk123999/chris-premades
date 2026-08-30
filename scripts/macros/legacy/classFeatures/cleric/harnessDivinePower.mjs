import {actorUtils, automationUtils, dialogUtils, rollUtils} from '../../../../proxy.mjs';
async function recover({workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, ['formula', 'maxSlotLevel']);
    const maxAmount = (await rollUtils.rollDice(config.formula || '1', {document: workflow.activity})).total;
    const maxLevel = (await rollUtils.rollDice(config.maxSlotLevel || 'ceil(@prof / 2)', {document: workflow.activity})).total;
    const selection = await dialogUtils.selectSpellSlots(
        workflow.actor,
        workflow.item.name,
        _loc('CHRISPREMADES.Macros.Legacy.HarnessDivinePower.Prompt', {totalSlots: maxAmount}),
        {maxAmount, maxAmountMode: 'count', maxLevel, recover: true}
    );
    if (!selection?.length) return;
    await Promise.all(selection.map(s => actorUtils.recoverSpellSlots(workflow.actor, s.key, {amount: s.amount})));
}
export const harnessDivinePower = {
    name: 'Harness Divine Power',
    version: '2.0.3',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: recover, 
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '1',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        },
        maxSlotLevel: {
            default: 'ceil(@prof / 2)',
            type: 'text',
            label: 'CHRISPREMADES.Config.MaxSpellLevel',
            category: 'behavior'
        }
    }
};
