import {CPRSingleRollResolver} from '../applications/rollResolverSingle.js';
import {DialogApp} from '../applications/dialog.js';
import {genericUtils} from '../utils.js';
function registerFulfillmentMethod() {
    CONFIG.Dice.fulfillment.methods.chrispremades = {
        label: 'Chris\'s Premades',
        icon: '<i class="fa-solid fa-kit-medical"></i>',
        interactive: true,
        resolver: CPRSingleRollResolver
    };
    CONFIG.Dice.fulfillment.defaultMethod = 'chrispremades';
    game.settings.set('core', 'diceConfiguration', {
        d4: 'chrispremades',
        d6: 'chrispremades',
        d8: 'chrispremades',
        d10: 'chrispremades',
        d12: 'chrispremades',
        d20: 'chrispremades',
        d100: 'chrispremades'
    });
}
function unregisterFulfillmentMethod() {
    delete CONFIG.Dice.fulfillment.methods.chrispremades;
    CONFIG.Dice.fulfillment.defaultMethod = '';
    game.settings.set('core', 'diceConfiguration', {
        d4: '',
        d6: '',
        d8: '',
        d10: '',
        d12: '',
        d20: '',
        d100: ''
    });
}
async function manualRollsPreferencesDialog() {
    let currentSetting = genericUtils.getCPRSetting('manualRollsPreferences');
    let title = 'CHRISPREMADES.Settings.manualRollsPreferences.Name';
    let content = 'CHRISPREMADES.Settings.manualRollsPreferences.Hint';
    let inputs = [['checkbox', game.users.map(user => ({
        label: user.name,
        name: user.id,
        options: {
            isChecked: currentSetting?.[user.id] ?? false
        }
    })), {displayAsRows: true}]];
    let buttons = 'okCancel';
    let result = await DialogApp.dialog(title, content, inputs, buttons);
    if (!result?.buttons) return;
    delete result.buttons;
    genericUtils.setCPRSetting('manualRollsPreferences', result);
}
export let rollResolver = {
    registerFulfillmentMethod: registerFulfillmentMethod,
    unregisterFulfillmentMethod: unregisterFulfillmentMethod,
    manualRollsPreferencesDialog: manualRollsPreferencesDialog
};