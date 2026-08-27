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
    const macroGroup = defaultInfo.rules === '2024' ? modern :
        defaultInfo.rules === '2014' ? legacy : all;
    let identifier = defaultInfo.identifier;
    if (defaultInfo.sourceType) identifier += '|' + defaultInfo.sourceType;
    const macro = macroGroup[identifier];
    if (macro) return {
        config: macro.config,
        notes: macro.notes,
        scales: macro.scales,
        version: macro.version
    };
}
