import {genericUtils} from '../utils.js';
import * as legacyMacros from '../legacyMacros.js';
import * as macros from '../legacyMacros.js';
let customMacroList = [];
let registeredMacroList = [];
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
        if (!value.rules) value.rules = 'modern';
        return value;
    }))).filter(j => j);
}
function getMacro(identifier, rules = 'modern') {
    let version = game.settings.get('dnd5e', 'rulesVersion');
    let found = customMacroList.find(i => i.identifier === identifier && i.rules === rules) ?? registeredMacroList.find(j => j.identifier === identifier && j.rules === rules) ?? (version === 'modern' ? macros[identifier] : legacyMacros[identifier])   ; //fix this last part to check the system rules version
    if (!found && version === 'modern' && genericUtils.getCPRSetting('useFallbackMacros')) found = customMacroList.find(i => i.identifier === identifier && i.rules === 'legacy') ?? registeredMacroList.find(j => j.identifier === identifier  && j.rules === 'legacy') ?? legacyMacros[identifier];
    return found;
}
function preCreateMacro(document, updates, options, userId) {
    let key = genericUtils.getCPRSetting('macroCompendium');
    if (!key) return;
    if (key != document.pack) return;
    if (document.command != '') return;
    let script = `const {DialogApp, Crosshairs, Summons, Teleport, utils: {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils, spellUtils, regionUtils}} = chrisPremades;
    `;
    document.updateSource({command: script});
}
function updateOrDeleteMacro(document, updates, options, userId) {
    if (genericUtils.getCPRSetting('macroCompendium') != document.pack) return;
    ready();
}
function getCustomMacroList() {
    return customMacroList.concat(registeredMacroList);
}
function registerMacros(input) {
    let validatedMacros = input.filter(i => {
        let identifier = i.identifier ?? i.name?.slugify();
        if (!identifier) {
            genericUtils.notify('CHRISPREMADES.CustomMacros.NoIdentifier');
            return false;
        }
        return true;
    });
    registeredMacroList.push(...validatedMacros);
}
export let custom = {
    ready,
    getMacro,
    preCreateMacro,
    updateOrDeleteMacro,
    getCustomMacroList,
    registerMacros
};