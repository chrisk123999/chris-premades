import {DialogApp} from '../applications/dialog.js';
import {Crosshairs} from '../lib/crosshairs.js';
import {Summons} from '../lib/summons.js';
import {Teleport} from '../lib/teleport.js';
import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, templateUtils, tokenUtils, workflowUtils} from '../utils.js';
import * as macros from '../macros.js';
let customMacroList = [];
async function ready() {
    let pack = game.packs.get(genericUtils.getCPRSetting('macroCompendium'));
    console.log(pack);
    if (!pack) return {};
    await pack.getDocuments();
    customMacroList = (await Promise.all(pack.map(async i => {
        let value = await i.execute();
        if (!value.identifier) {
            let message = genericUtils.translate('CHRISPREMADES.CustomMacros.MissingIdentifier').replace('{name}', i.name);
            genericUtils.notify(message, 'error');
            return;
        }
        if (value.midi?.item) value.midi.item.forEach(j => j.custom = true);
        if (value.midi?.actor) value.midi.item.forEach(j => j.custom = true);
        return value;
    }))).filter(j => j);
    console.log(customMacroList);
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
export let custom = {
    ready,
    getMacro,
    runMacro,
    customMacroList
};