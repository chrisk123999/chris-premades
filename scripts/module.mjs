import constants from './constants.mjs';
import {all, generic, legacy, modern} from './macros.mjs';
import * as animations from './macros/animations.mjs';
import {bg3Hooks} from './macros/legacy/homebrew/bg3WeaponActions.mjs';
import {dmgCleaveHooks} from './macros/legacy/homebrew/dmgCleave.mjs';
import * as weaponMasteries from './macros/weaponMasteries.mjs';
import {api, constants as catConstants} from './proxy.mjs';
import {registerSettings} from './settings.mjs';
Hooks.once('catInit', () => {
    registerSettings();
    Hooks.on(catConstants.workflowHookNames.rollFinished, dmgCleaveHooks.rollFinished);
});
Hooks.on('updateItem', bg3Hooks.equipped);
Hooks.on('dnd5e.restCompleted', bg3Hooks.rest);
Hooks.once('init', () => {
    const firearmKey = 'CHRISPREMADES.Macros.Generic.Firearm.';
    CONFIG.DND5E.weaponTypes.firearm = firearmKey + 'Type';
    CONFIG.DND5E.weaponTypeMap.firearm = 'ranged';
    CONFIG.DND5E.weaponProficiencies.firearm = firearmKey + 'Proficiency';
    CONFIG.DND5E.weaponProficienciesMap.firearm = 'firearm';
    for (const property of constants.firearmProperties) {
        CONFIG.DND5E.itemProperties[property] = {label: firearmKey + 'Properties.' + property.capitalize()};
        CONFIG.DND5E.validProperties.weapon.add(property);
    }
    for (const [baseItem, uuid] of Object.entries(constants.firearmBaseItems)) CONFIG.DND5E.weaponIds[baseItem] = 'Compendium.' + uuid;
});
Hooks.once('catReady', () => {
    const validKeys = [...catConstants.triggerTypes, 'rules', 'generic', 'genericConfig', 'documents'];
    const ignoredPackIds = [constants.packs.samples.embeddedMacros, constants.packs.misc.automationItems];
    Object.entries(animations).forEach(([identifier, value]) => api.registerAnimation({
        ...value,
        source: 'chris-premades',
        identifier
    }));
    const data = [...Object.entries(all), ...Object.entries(generic),...Object.entries(legacy), ...Object.entries(modern)];
    data.forEach(([identifier, value]) => {
        const functionData = {
            source: 'chris-premades',
            identifier
        };
        validKeys.forEach(key => {
            if (value[key] !== undefined) functionData[key] = value[key];
        });
        api.registerFnMacro(functionData);
        if (value.scales) {
            value.scales.forEach(i => {
                if (!i.data) return;
                api.registerScale({
                    source: 'chris-premades',
                    rules: value.rules ?? 'all',
                    identifier: i.identifier,
                    classIdentifier: i.classIdentifier,
                    data: i.data
                });
            });
        }
    });
    Object.entries(weaponMasteries).forEach(([mastery, value]) => api.registerMastery({...value, mastery}));
    api.registerSourceName('chris-premades', 'Cauldron of Plentiful Resources');
    api.registerAutomationModule('chris-premades', {ignoredPackIds, infoFetcherCallback});
    api.postWelcome('chris-premades', {title: 'CHRISPREMADES.Welcome.Title', content: 'CHRISPREMADES.Welcome.Content'});
});

// result is merged back into defaultInfo and used for the registered automation
function infoFetcherCallback(_document, defaultInfo) {
    const rules = defaultInfo.rules || 'all';
    const collection = getMacroCollection(rules);
    const baseID = defaultInfo.identifier;
    const sourcedID = baseID + '|' + defaultInfo.sourceType;
    const macro = collection[baseID] ?? collection[sourcedID];
    const allMacro = all[baseID] ?? all[sourcedID];
    if (macro || allMacro) return {
        monsterIdentifier: macro?.monsterIdentifier ?? allMacro?.monsterIdentifier,
        scales: getScale(macro, rules) ?? getScale(allMacro, 'all'),
        version: macro?.version ?? allMacro?.version,
        config: macro?.config ?? allMacro?.config,
        notes: macro?.notes ?? allMacro?.notes
    };
}

function getMacroCollection(rules) {
    switch(rules) {
        case '2024': return modern;
        case '2014': return legacy;
        default: return all;
    }
}

function getScale(macro, rules) {
    if (!macro?.scales?.length) return;
    return macro.scales.map(i => ({
        classIdentifier: i.classIdentifier,
        identifier: i.identifier,
        source: 'chris-premades',
        rules
    }));
}
