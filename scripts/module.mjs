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
    });
    api.registerSourceName('chris-premades', 'Cauldron of Plentiful Resources');
    const configs2024 = {};
    const versions2024 = {};
    Object.entries(modern).map(([identifier, value]) => {
        if (value.config) configs2024[identifier] = value.config;
        if (value.version) versions2024[identifier] = value.version;
    });
    const packs = packIds.map(i => game.packs.get(i));
    packs.forEach(pack => {
        api.registerAutomationCompendium(pack, {configs2024, versions2024, source: 'chris-premades'});
    });
});