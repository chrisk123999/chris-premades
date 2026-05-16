import {dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let validSpells = workflow.actor.items.filter(item => {
        if (item.type !== 'spell') return;
        if (item.flags.dnd5e?.cachedFor) return;
        if (!item.system.level) return;
        if (item.system.sourceClass !== classIdentifier) return;
        if (item.system.method !== 'spell') return;
        if (![0, 1].includes(item.system.prepared)) return;
        return true;
    });
    let unpreparedSpells = validSpells.filter(item => item.system.prepared === 0);
    let preparedSpells = validSpells.filter(item => item.system.prepared === 1);
    if (!unpreparedSpells.length || !preparedSpells.length) return;
    let spellToPrepare = await dialogUtils.selectDocumentDialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.MemorizeSpell.Prepare',
        unpreparedSpells,
        {showSpellLevel: true}
    );
    if (!spellToPrepare) return;
    let spellToUnprepare = await dialogUtils.selectDocumentDialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.MemorizeSpell.Unprepare',
        preparedSpells,
        {showSpellLevel: true}
    );
    if (!spellToUnprepare) return;
    await genericUtils.update(spellToPrepare, {'system.prepared': 1});
    await genericUtils.update(spellToUnprepare, {'system.prepared': 0});
}
export let memorizeSpell = {
    name: 'Memorize Spell',
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
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'wizard',
            category: 'homebrew',
            homebrew: true
        }
    ]
};