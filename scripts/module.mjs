import {Logging, api} from './proxy.mjs';
import * as animations from './macros/animations.mjs';
import {generic} from './macros.mjs';
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
const validKeys = ['rules', 'aura', 'check', 'combat', 'effect', 'move', 'region', 'rest', 'save', 'skill', 'time', 'tool', 'roll', 'generic', 'genericConfig'];
Hooks.once('catReady', () => {
    Object.entries(animations).forEach(([identifier, value]) => api.registerAnimation({
        source: 'chris-premades',
        identifier,
        name: value.name,
        macro: value.macro,
        requirements: value.requirements,
        type: value.type,
        config: value.config,
        category: value.category,
        inputs: value.inputs
    }));
    Object.entries(generic).forEach(([identifier, value]) => {
        const automationData = {
            source: 'chris-premades',
            identifier
        };
        validKeys.forEach(key => {
            if (value[key] !== undefined) {
                automationData[key] = value[key];
            }
        });
        api.registerFnMacro(automationData);
    });
});