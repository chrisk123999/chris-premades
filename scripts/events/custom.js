import {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, genericUtils, itemUtils, macroUtils, rollUtils, socketUtils, spellUtils, templateUtils, tokenUtils, workflowUtils, thirdPartyUtils} from '../utils.js';
import * as legacyMacros from '../legacyMacros.js';
import * as macros from '../macros.js';
import {Crosshairs} from '../lib/crosshairs.js';
import {Summons} from '../lib/summons.js';
import {Teleport} from '../lib/teleport.js';
import {DialogApp} from '../applications/dialog.js';
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
function getMacro(identifier, rules = 'legacy') {
    return customMacroList.find(i => i.identifier === identifier && i.rules === rules) ?? registeredMacroList.find(j => j.identifier === identifier && j.rules === rules) ?? (rules === 'modern' ? macros[identifier] : legacyMacros[identifier]);
}
function preCreateMacro(document, updates, options, userId) {
    let key = genericUtils.getCPRSetting('macroCompendium');
    if (!key) return;
    if (key != document.pack) return;
    if (document.command != '') return;
    let script = `const {DialogApp, Crosshairs, Summons, Teleport, utils: {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, macroUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils, spellUtils, regionUtils, thirdPartyUtils}} = chrisPremades;
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
async function executeScript({script, ...scope} = {}) {
    const defaultScope = {
        activityUtils,
        actorUtils,
        animationUtils,
        combatUtils,
        compendiumUtils,
        crosshairUtils,
        dialogUtils,
        effectUtils,
        genericUtils,
        itemUtils,
        macroUtils,
        rollUtils,
        socketUtils,
        spellUtils,
        templateUtils,
        tokenUtils,
        workflowUtils,
        thirdPartyUtils,
        constants,
        Crosshairs,
        Summons,
        Teleport,
        DialogApp
    };
    scope = {...defaultScope, ...scope};
    let argNames = Object.keys(scope);
    if (argNames.some(k => Number.isNumeric(k))) throw new Error('Illegal numeric Macro parameter passed to execution scope.');
    let argValues = Object.values(scope);
    let fn = new foundry.utils.AsyncFunction(...argNames, `{${script}}\n`);
    let result;
    try {
        result = await fn(...argValues);
    } catch (error) {
        console.error(error);
    }
    fn = null;
    return result;
}
export let custom = {
    ready,
    getMacro,
    preCreateMacro,
    updateOrDeleteMacro,
    getCustomMacroList,
    registerMacros,
    executeScript
};