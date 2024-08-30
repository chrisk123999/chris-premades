import {DialogApp} from '../applications/dialog.js';
import {genericUtils} from '../utils.js';
async function selectJournal(settingKey) {
    let oldKey = genericUtils.getCPRSetting(settingKey);
    let journals = game.journal.filter(i => i.pages.find(j => j.type === 'spells'));
    let inputs = journals.map(i => ({
        label: i.name,
        name: i.id,
        options: {isChecked: oldKey === i.id}
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.' + settingKey + '.Name', 'CHRISPREMADES.Settings.' + settingKey + '.Hint', [['radio', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-select-spell-compendium'});
    if (!selection) return;
    await genericUtils.setCPRSetting(settingKey, selection.radio);
}
async function getClassSpells(identifier) {
    let journalId = genericUtils.getCPRSetting('classSpellList');
    if (!journalId || journalId === '') return;
    let journal = game.journal.get(journalId);
    if (!journal) return;
    let page = journal.pages.find(i => i.type === 'spells' && i.system?.type === 'class' && i.system?.identifier === identifier);
    if (!page) return;
    return await Promise.all(page.system.spells.map(async i => await fromUuid(i)).filter(j => j));
}
async function getAllClassSpells() {
    let journalId = genericUtils.getCPRSetting('classSpellList');
    if (!journalId || journalId === '') return;
    let journal = game.journal.get(journalId);
    if (!journal) return;
    let pages = journal.pages.filter(i => i.type === 'spells' && i.system?.type === 'class');
    let spellUuids = new Set();
    pages.forEach(i => i.system.spells.forEach(j => spellUuids.add(j)));
    return await Promise.all(spellUuids.map(async i => await fromUuid(i)));
}
export let spellList = {
    selectJournal,
    getClassSpells,
    getAllClassSpells
};