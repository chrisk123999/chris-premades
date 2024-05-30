import {registerHooks} from './hooks.js';
import {setupJournal} from './journal.js';
import {registerSettings} from './settings.js';
Hooks.once('init', () => {
    registerSettings();
});
Hooks.once('ready', () => {
    registerHooks();
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
    }
});