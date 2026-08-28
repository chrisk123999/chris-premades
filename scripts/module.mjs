import {Logging, api, constants as catConstants} from './proxy.mjs';
import constants from './constants.mjs';
import * as animations from './macros/animations.mjs';
import {all, generic, legacy, modern} from './macros.mjs';
Hooks.once('i18nInit', () => {

});
Hooks.once('init', () => {

});
Hooks.once('libWrapper.Ready', () => {

});
Hooks.once('ready', () => {
    
});
Hooks.once('catInit', () => {

});
Hooks.once('catReady', () => {
    const validKeys = [...catConstants.triggerTypes(), 'rules', 'generic', 'genericConfig', 'documents'];
    const ignoredPackIds = [constants.packs.samples.embeddedMacros];
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
    api.registerSourceName('chris-premades', 'Cauldron of Plentiful Resources');
    api.registerAutomationModule('chris-premades', {ignoredPackIds, infoFetcherCallback});
});

// returns an object that may overwrite any keys in defaultInfo, or add config, notes, scales, type
function infoFetcherCallback(_document, defaultInfo) {
    const rules = defaultInfo.rules || 'all';
    const collection = getMacroCollection(rules);
    let identifier = defaultInfo.identifier;
    if (defaultInfo.sourceType) identifier += '|' + defaultInfo.sourceType;
    const macro = collection[identifier] ?? collection[defaultInfo.identifier];
    const allMacro = all[identifier] ?? all[defaultInfo.identifier];
    if (macro || allMacro) return {
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
