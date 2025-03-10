import {dialogUtils, genericUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let spells = workflow.actor.items.filter(i => i.type === 'spell');
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentsDialog(workflow.item.name, 'CHRISPREMADES.Macros.PsionicSpells.Select', spells, {sortAlphabetical: true, checkbox: true});
    if (!selection) return;
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'psionicSpells.spells', selection.filter(i => i.amount).map(j => j.document.id));
}
export let psionicSpells = {
    name: 'Psionic Spells',
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