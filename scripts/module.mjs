import {Logging, api} from './proxy.mjs';
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
// simplify this with cat.lib.constants.triggerTypes(), pending cat/#21
const validKeys = ['rules', 'aura', 'called', 'check', 'combat', 'effect', 'item', 'move', 'region', 'rest', 'save', 'skill', 'time', 'tool', 'roll', 'summon', 'generic', 'genericConfig', 'documents'];
Hooks.once('catReady', () => {
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
    const configsAll = {};
    const notesAll = {};
    const versionsAll= {};
    const scalesAll = {};
    Object.entries(all).map(([identifier, value]) => {
        if (value.config) configsAll[identifier] = value.config;
        if (value.notes) notesAll[identifier] = value.notes;
        if (value.version) versionsAll[identifier] = value.version;
        if (value.scales) scalesAll[identifier] = value.scales.map(i => ({source: 'chris-premades', identifier: i.identifier, classIdentifier: i.classIdentifier, rules: 'all'}));
    });
    const configs2024 = {};
    const notes2024 = {};
    const versions2024 = {};
    const scales2024 = {};
    Object.entries(modern).map(([identifier, value]) => {
        if (value.config) configs2024[identifier] = value.config;
        if (value.notes) notes2024[identifier] = value.notes;
        if (value.version) versions2024[identifier] = value.version;
        if (value.scales) scales2024[identifier] = value.scales.map(i => ({source: 'chris-premades', identifier: i.identifier, classIdentifier: i.classIdentifier, rules: '2024'}));
    });
    const configs2014 = {};
    const notes2014 = {};
    const versions2014 = {};
    const scales2014 = {};
    Object.entries(legacy).map(([identifier, value]) => {
        if (value.config) configs2014[identifier] = value.config;
        if (value.notes) notes2014[identifier] = value.notes;
        if (value.version) versions2014[identifier] = value.version;
        if (value.scales) scales2014[identifier] = value.scales.map(i => ({source: 'chris-premades', identifier: i.identifier, classIdentifier: i.classIdentifier, rules: '2014'}));
    });
    api.registerAutomationModule('chris-premades', {ignoredPackIds, configs2014, configs2024, configsAll, versions2014, versions2024, versionsAll, notes2014, notes2024, notesAll, scales2014, scales2024, scalesAll});
});