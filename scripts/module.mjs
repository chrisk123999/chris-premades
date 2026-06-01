import {Logging, api} from './proxy.mjs';
import * as animations from './macros/animations.mjs';
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
    Object.entries(animations).forEach(([identifier, value]) => api.registerAnimation({
        source: 'chris-premades',
        identifier,
        name: value.name,
        macro: value.macro,
        requirements: value.requirements,
        type: value.type
    }));
});