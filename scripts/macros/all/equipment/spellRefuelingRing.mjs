import {actorUtils, automationUtils, constants, dialogUtils} from '../../../proxy.mjs';
async function restore({workflow}) {
    const maxLevel = automationUtils.getConfigValue(workflow.item, 'level');
    const choice = (await dialogUtils.selectSpellSlots(
        workflow.actor,
        workflow.item.name,
        _loc('CHRISPREMADES.Macros.Legacy.HarnessDivinePower.Prompt', {maxAmount: _loc('DND5E.spell')}),
        {maxAmount: 1, maxAmountMode: 'count', maxLevel, recover: true}
    ))?.[0]; 
    if (!choice) return;
    await actorUtils.recoverSpellSlots(workflow.actor, choice.key);
}
export const spellRefuelingRing = {
    name: 'Spell-Refueling Ring',
    version: '2.0.5',
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: restore,
            priority: 50
        }
    ],
    config: {
        level: {
            default: 3,
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxLevel',
            get options() { return constants.spellSlotOptions; }
        }
    }
};
