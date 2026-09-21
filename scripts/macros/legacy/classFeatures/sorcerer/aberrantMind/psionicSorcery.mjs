import {actorUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
import utils from '../../../../../utils.mjs';
import {subtleComponents} from '../metamagic.mjs';
async function use({document, workflow}) {
    const psionicSpells = actorUtils.getItemByIdentifier(workflow.actor, 'psionic-spells');
    const spellIds = psionicSpells?.flags['chris-premades']?.psionicSpells?.spells ?? [];
    const available = actorUtils.getItemByIdentifier(workflow.actor, 'font-of-magic')?.system.uses.value ?? 0;
    const spells = spellIds.map(id => workflow.actor.items.get(id)).filter(spell => spell && spell.system.level <= available);
    if (!spells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.PsionicSorcery.NoSpells', {type: 'info'});
        return;
    }
    const selection = await dialogUtils.selectDocumentDialog(document.item.name, _loc('CHRISPREMADES.Macros.Legacy.PsionicSorcery.Select'), spells, {sort: 'level', showSpellLevel: true});
    if (!selection) return;
    await utils.spendScaledCost(document.item, 'psionic-sorcery-cost', selection.system.level);
    const spellData = selection.toObject();
    const removed = [...subtleComponents, ...(spellData.system.materials.consumed ? [] : ['material'])];
    spellData.system.properties = spellData.system.properties.filter(property => !removed.includes(property));
    spellData.system.method = 'innate';
    await workflowUtils.completeItemUse(itemUtils.syntheticItem(spellData, workflow.actor));
}
export const psionicSorcery = {
    name: 'Psionic Sorcery',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'activityRollFinished', macro: use, priority: 50}
    ]
};
