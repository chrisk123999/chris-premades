import {DialogApp} from '../applications/dialog.js';
import {Crosshairs} from '../lib/crosshairs.js';
import {Summons} from '../lib/summons.js';
import {Teleport} from '../lib/teleport.js';
import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils} from '../utils.js';
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
        if (!value.identifier) {
            let message = genericUtils.translate('CHRISPREMADES.CustomMacros.MissingIdentifier').replace('{name}', i.name);
            genericUtils.notify(message, 'error');
            return;
        }
        if (value.midi?.item) value.midi.item.forEach(j => j.custom = true);
        if (value.midi?.actor) value.midi.item.forEach(j => j.custom = true);
        return value;
    }))).filter(j => j);
}
async function runMacro({trigger, workflow, options, actor, ditem} = {}) {
    let vars = {};
    if (workflow) vars.workflow = workflow;
    if (options) vars.options = options;
    if (actor) vars.actor = actor;
    if (ditem) vars.ditem = ditem;
    if (trigger) vars.trigger = trigger;
    return await trigger.macro(vars);
}
function getMacro(identifier) {
    return customMacroList.find(i => i.identifier === identifier) ?? macros[identifier];
}
function preCreateMacro(document, updates, options, userId) {
    if (genericUtils.getCPRSetting('macroCompendium') != document.pack) return;
    if (document.command != '') return;
    let script = `const {DialogApp, Crosshairs, Summons, Teleport} = chrisPremades; const {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils} = chrisPremades.utils;`;
    document.updateSource({command: script});
}
function updateOrDeleteMacro(document, updates, options, userId) {
    if (genericUtils.getCPRSetting('macroCompendium') != document.pack) return;
    ready();
}
export let custom = {
    ready,
    getMacro,
    runMacro,
    customMacroList,
    preCreateMacro,
    updateOrDeleteMacro
};