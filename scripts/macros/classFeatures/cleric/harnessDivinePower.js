import {dialogUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let spells = workflow.actor.system.spells;
    let maxLevel = Math.ceil(workflow.actor.system.attributes.prof / 2);
    let buttons = [];
    for (let i = 1; i <= maxLevel; i++) {
        let key = 'spell' + i;
        if ((spells[key].value < spells[key].max) && spells[key].max > 0) buttons.push([CONFIG.DND5E.spellLevels[i], key]);
    }
    if (spells.pact.max > 0 && spells.pact.level <= maxLevel && spells.pact.value < spells.pact.max) buttons.push([CONFIG.DND5E.spellPreparationModes.pact.label, 'pact']);
    if (!buttons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoMissing', 'info');
        return;
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Generic.RecoverSpellSlot', buttons);
    if (!selection?.length) return;
    let key = 'system.spells.' + selection + '.value';
    let value = genericUtils.getProperty(workflow.actor, key);
    await genericUtils.update(workflow.actor, {[key]: value + 1});
}
export let harnessDivinePower = {
    name: 'Harness Divine Power',
    version: '0.12.40',
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