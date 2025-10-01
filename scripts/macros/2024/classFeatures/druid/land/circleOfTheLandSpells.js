import {dialogUtils, effectUtils, genericUtils, socketUtils, spellUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let buttons = [
        ['CHRISPREMADES.Macros.CircleOfTheLandSpells.Arid', 'land-arid'],
        ['CHRISPREMADES.Macros.CircleOfTheLandSpells.Polar', 'land-polar'],
        ['CHRISPREMADES.Macros.CircleOfTheLandSpells.Temperate', 'land-temperate'],
        ['CHRISPREMADES.Macros.CircleOfTheLandSpells.Tropical', 'land-tropical']
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, genericUtils.translate('CHRISPREMADES.Macros.CircleOfTheLandSpells.ChooseLand'), buttons, {
        displayAsRows: true,
        userId: socketUtils.firstOwner(workflow.actor, true)
    });
    if (!selection) return;
    let existingSpells = workflow.actor.itemTypes.spell.filter(i => i.getFlag('chris-premades', 'isCircleOfTheLandSpell'));
    await genericUtils.deleteEmbeddedDocuments(workflow.actor, 'Item', existingSpells.map(i => i.id));
    let druidLevel = workflow.actor.classes?.druid?.levels ?? 0;
    let maxLevel = druidLevel > 9
        ? 5
        : druidLevel > 6
            ? 4
            : druidLevel > 4
                ? 3
                : 2;
    // eslint-disable-next-line no-undef
    let newSpellIdentifiers = dnd5e.registry.spellLists.forType('subclass', selection)?.identifiers;
    if (!newSpellIdentifiers) return;
    let newSpells = await Promise.all(Array.from(newSpellIdentifiers).map(i => spellUtils.getCompendiumSpell(i, {rules: 'modern', bySystemIdentifier: true})));
    newSpells = newSpells.filter(i => i?.system.level <= maxLevel).map(i => genericUtils.mergeObject(i.toObject(), {
        system: {
            prepared: 2
        },
        flags: {
            'chris-premades': {
                isCircleOfTheLandSpell: true
            }
        }
    }));
    if (!newSpells.length) return;
    await genericUtils.createEmbeddedDocuments(workflow.actor, 'Item', newSpells);
    let naturesWardEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'naturesWard');
    if (!naturesWardEffect) return;
    let newChanges = naturesWardEffect.toObject().changes;
    switch (selection) {
        case 'land-arid':
            newChanges[1].value = 'fire';
            break;
        case 'land-polar':
            newChanges[1].value = 'cold';
            break;
        case 'land-temperate':
            newChanges[1].value = 'lightning';
            break;
        case 'land-tropical':
            newChanges[1].value = 'poison';
    }
    await genericUtils.update(naturesWardEffect, {changes: newChanges});
}
export let circleOfTheLandSpells = {
    name: 'Circle of the Land Spells',
    version: '1.3.83',
    rules: 'modern',
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