import {genericUtils, itemUtils, rollUtils} from '../../../../utils.js';
import {DialogApp} from '../../../../applications/dialog.js';
async function use({trigger, workflow}) {
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let bonuses = [
        'arcaneGrimoire1',
        'arcaneGrimoire2',
        'arcaneGrimoire3',
        'grimoireInfinitus1',
        'grimoireInfinitus2',
        'grimoireInfinitus3'
    ];
    let bonus = 0;
    bonuses.forEach(identifier => {
        let item = itemUtils.getItemByIdentifier(workflow.actor, identifier);
        if (!item) return;
        bonus += itemUtils.getConfig(item, 'bonus');
    });
    let spells = workflow.actor.system.spells;
    let availableLevels = [];
    let inputFields = [];
    let totalSlots = (await rollUtils.rollDice(formula + ' + ' + bonus, {entity: workflow.activity})).total;
    for (let i = 1; i <= 5; i++) {
        let spellData = spells['spell' + i];
        if (spellData && spellData.max > 0 && spellData.value < spellData.max) {
            let missingSlots = spellData.max - spellData.value;
            availableLevels.push(i);
            inputFields.push({
                label: genericUtils.format('CHRISPREMADES.Macros.ArcaneRecovery.Slot', {slot: i}),
                name: 'spell' + i,
                options: {
                    minAmount: 0,
                    maxAmount: missingSlots,
                    currentAmount: 0,
                    weight: i 
                }
            });
        }
    }
    if (!inputFields.length) return;
    let inputs = [
        [
            'selectAmount', 
            inputFields, 
            {
                totalMax: totalSlots, 
                displayAsRows: true
            }
        ]
    ];
    let selection = await DialogApp.dialog(
        workflow.item.name, 
        genericUtils.format('CHRISPREMADES.Macros.ArcaneRecovery.Context', {totalSlots}), 
        inputs, 
        'okCancel'
    );
    if (!selection?.buttons) return;
    let updates = {};
    let totalRecovered = 0;
    for (let i of availableLevels) {
        let amount = parseInt(selection['spell' + i]) || 0;
        if (amount > 0) {
            totalRecovered += (amount * i);
            updates['system.spells.spell' + i + '.value'] = spells['spell' + i].value + amount;
        }
    }
    if (Object.keys(updates).length > 0) genericUtils.update(workflow.actor, updates);
}
export let arcaneRecovery = {
    name: 'Arcane Recovery',
    rules: 'modern',
    version: '1.5.30',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: 'ceil(@classes.wizard.levels / 2)',
            category: 'homebrew',
            homebrew: true
        }
    ]
};