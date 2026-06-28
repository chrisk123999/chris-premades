import {Logging, api} from './proxy.mjs';
import * as animations from './macros/animations.mjs';
import {generic, modern} from './macros.mjs';
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
const validKeys = ['rules', 'aura', 'check', 'combat', 'effect', 'move', 'region', 'rest', 'save', 'skill', 'time', 'tool', 'roll', 'summon', 'generic', 'genericConfig', 'documents'];
const packIds = ['world.cpr-class-features-modern'];
//const packIds = [];
Hooks.once('catReady', () => {
    Object.entries(animations).forEach(([identifier, value]) => api.registerAnimation({
        ...value,
        source: 'chris-premades',
        identifier
    }));
    const data = [...Object.entries(generic), ...Object.entries(modern)];
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
                    rules: '2024',
                    identifier: i.identifier,
                    data: i.data
                });
            });
        }
    });
    api.registerSourceName('chris-premades', 'Cauldron of Plentiful Resources');
    const configs2024 = {};
    const versions2024 = {};
    const scales2024 = {};
    Object.entries(modern).map(([identifier, value]) => {
        if (value.config) configs2024[identifier] = value.config;
        if (value.version) versions2024[identifier] = value.version;
        if (value.scales) scales2024[identifier] = value.scales.map(i => ({source: 'chris-premades', identifier: i.identifier, classIdentifier: i.classIdentifier, rules: '2024'}));
    });
    const packs = packIds.map(i => game.packs.get(i));
    packs.forEach(pack => {
        api.registerAutomationCompendium(pack, {configs2024, versions2024, scales2024, source: 'chris-premades'});
    });
});