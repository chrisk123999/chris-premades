import {automationUtils, dialogUtils, documentUtils, Logging} from '../../../../proxy.mjs';
async function use({workflow}) {
    const classIdentifier = automationUtils.getConfigValue(workflow.item, 'classIdentifier');
    const validSpells = workflow.actor.items.filter(item => item.type === 'spell'
        && !item.flags.dnd5e?.cachedFor
        && item.system.level
        && item.system.classIdentifier === classIdentifier
        && item.system.method === 'spell'
        && [0, 1].includes(item.system.prepared));
    const unpreparedSpells = validSpells.filter(item => item.system.prepared === 0);
    const preparedSpells = validSpells.filter(item => item.system.prepared === 1);
    if (!unpreparedSpells.length || !preparedSpells.length) return Logging.addMacroWarning('CPR', 'memorize-spell', 'No valid spells to swap.');
    const spellToPrepare = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.MemorizeSpell.Prepare'), unpreparedSpells, {showSpellLevel: true});
    if (!spellToPrepare) return;
    const spellToUnprepare = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Modern.MemorizeSpell.Unprepare'), preparedSpells, {showSpellLevel: true});
    if (!spellToUnprepare) return;
    await documentUtils.updateEmbeddedDocuments(workflow.actor, 'Item', [{_id: spellToPrepare.id, 'system.prepared': 1}, {_id: spellToUnprepare.id, 'system.prepared': 0}]);
}
export const memorizeSpell = {
    name: 'Memorize Spell',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'wizard',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
