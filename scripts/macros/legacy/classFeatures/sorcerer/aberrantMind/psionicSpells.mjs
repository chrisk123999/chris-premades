import {dialogUtils, documentUtils, genericUtils, itemUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const spells = workflow.actor.items.filter(spell => spell.type === 'spell');
    if (!spells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.PsionicSpells.NoSpells', {type: 'info'});
        return;
    }
    const checked = new Set(document.flags['chris-premades']?.psionicSpells?.spells ?? []);
    const selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.PsionicSpells.Select'), spells, {
        max: spells.length,
        checkbox: true,
        sort: 'alphabetical',
        checked
    });
    if (!selection) return;
    const chosen = selection.filter(entry => entry.amount).map(entry => entry.document);
    await documentUtils.setFlag(document, 'chris-premades', 'psionicSpells.spells', chosen.map(spell => spell.id));
    const names = chosen.map(spell => spell.name).sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}));
    await itemUtils.setDescriptionBlock(document, names.length ? '<p>' + _loc('CHRISPREMADES.Macros.Legacy.PsionicSpells.Chosen', {spells: names.join(', ')}) + '</p>' : '');
}
export const psionicSpells = {
    name: 'Psionic Spells',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
