import {genericUtils} from '../utils.js';
import * as macros from '../macros.js';
let customMacroList = [];
async function ready() {
    let key = genericUtils.getCPRSetting('macroCompendium');
    let pack = game.packs.get(key);
    if (!pack) return {};
    await pack.getDocuments();
    customMacroList = (await Promise.all(pack.map(async i => {
        let value = await i.execute();
        if (!value) {
            let message = genericUtils.translate('CHRISPREMADES.CustomMacros.NoReturn').replace('{name}', i.name);
            genericUtils.notify(message, 'error');
            return;
        }
        if (!value.identifier) value.identifier = i.name.slugify();
        return value;
    }))).filter(j => j);
}
function getMacro(identifier) {
    return customMacroList.find(i => i.identifier === identifier) ?? macros[identifier];
}
function preCreateMacro(document, updates, options, userId) {
    let key = genericUtils.getCPRSetting('macroCompendium');
    if (!key) return;
    if (key != document.pack) return;
    if (document.command != '') return;
    let script = `const {DialogApp, Crosshairs, Summons, Teleport} = chrisPremades;\nconst {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils, spellUtils} = chrisPremades.utils\n\n//Your Code Here:
    `;
    document.updateSource({command: script});
}
function updateOrDeleteMacro(document, updates, options, userId) {
    if (genericUtils.getCPRSetting('macroCompendium') != document.pack) return;
    ready();
}
function getCustomMacroList() {
    return customMacroList;
}
export let custom = {
    ready,
    getMacro,
    preCreateMacro,
    updateOrDeleteMacro,
    getCustomMacroList
};