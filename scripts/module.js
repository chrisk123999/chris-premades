import {registerHooks} from './hooks.js';
Hooks.once('ready', () => {
    registerHooks();
});