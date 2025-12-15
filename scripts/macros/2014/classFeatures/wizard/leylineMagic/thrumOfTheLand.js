import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let spells = workflow.actor.items.filter(i => i.flags['chris-premades']?.naturalAttunement);
    if (!spells.length) return;
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectASpell', spells, {sortAlphabetical: true, showSpellLevel: true});
    if (!selection) return;
    let itemData = genericUtils.duplicate(selection.toObject());
    switch (identifier) {
        case 'attackBonus': {
            Object.values(itemData.system.activities).forEach(activityData => {
                if (activityData.type != 'attack') return;
                itemData.system.activities[activityData._id].attack.bonus += '+2';
            });
            break;
        }
        case 'dcBonus': {
            Object.values(itemData.system.activities).forEach(activityData => {
                if (activityData.type != 'save') return;
                let hasFormula = itemData.system.activities[activityData._id].save.dc.formula && itemData.system.activities[activityData._id].save.dc.calculation;
                itemData.system.activities[activityData._id].save.dc.calculation = '';
                if (hasFormula) {
                    itemData.system.activities[activityData._id].save.dc.formula += ' + 1';
                } else {
                    itemData.system.activities[activityData._id].save.dc.formula = itemUtils.getSaveDC(selection) + ' + 1';
                }
            });
            break;
        }
    }
    let item = await itemUtils.syntheticItem(itemData, workflow.actor);
    let newWorkflow = await workflowUtils.completeItemUse(item);
    if (identifier === 'concentrationAdvantage') {
        let effect = effectUtils.getConcentrationEffect(workflow.actor, newWorkflow.item);
        if (effect) {
            let effectData = genericUtils.duplicate(effect.toObject());
            effectData.changes.push({
                key: 'flags.midi-qol.advantage.concentration',
                mode: 0,
                value: true,
                priority: 20
            });
            await genericUtils.update(effect, {changes: effectData.changes});
        }
    }
}
export let thrumOfTheLand = {
    name: 'Thrum of the Land',
    version: '1.3.149',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};