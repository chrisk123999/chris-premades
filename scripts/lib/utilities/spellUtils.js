import {spellList} from '../../extensions/spellList.js';
async function getSpellsOfLevel(level, {identifier} = {}) {
    let documents = identifier ? await spellList.getClassSpells(identifier) : await spellList.getAllClassSpells();
    return documents.filter(i => i.system.level === level);
}
function isClassSpell(item, identifier) {
    console.log(item);
    console.log(identifier);
    console.log(item.system?.sourceClass === identifier);
    return item.system?.sourceClass === identifier;
}
export let spellUtils = {
    getClassSpells: spellList.getClassSpells,
    getAllClassSpells: spellList.getAllClassSpells,
    getSpellsOfLevel,
    isClassSpell
};