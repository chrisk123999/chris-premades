import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let psionicSpells = itemUtils.getItemByIdentifier(workflow.actor, 'psionicSpells');
    if (!psionicSpells) return;
    let spellIds = psionicSpells.flags['chris-premades']?.psionicSpells?.spells;
    if (!spellIds) return;
    let sorceryPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorceryPoints?.system?.uses?.value) return;
    let spells = spellIds.map(i => workflow.actor.items.get(i)).filter(j => j).filter(k => k.system.level <= sorceryPoints.system.uses.value);
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.PsionicSorcery.Select', spells, {sortAlphabetical: true});
    if (!selection) return;
    await genericUtils.update(sorceryPoints, {'system.uses.spent': sorceryPoints.system.uses.spent + selection.system.level});
    await workflowUtils.completeItemUse(selection, {consumeSpellSlot: false}, {configureDialog: false});
}
export let psionicSorcery = {
    name: 'Psionic Sorcery',
    version: '1.2.17',
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