import {registerHooks} from './hooks.js';
import {registerSettings} from './settings.js';
Hooks.once('init', () => {
    registerSettings();
});
Hooks.once('ready', () => {
    registerHooks();
});