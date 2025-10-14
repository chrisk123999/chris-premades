import {CPRSingleRollResolver} from '../applications/rollResolverSingle.js';
import {DialogApp} from '../applications/dialog.js';
import {genericUtils, rollUtils, socketUtils} from '../utils.js';
import {d20} from '../events/d20.js';
function registerFulfillmentMethod() {
    CONFIG.Dice.fulfillment.methods.chrispremades = {
        label: 'Cauldron of Plentiful Resources',
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
async function manualRollsUsersDialog() {
    let currentSetting = genericUtils.getCPRSetting('manualRollsUsers');
    let title = 'CHRISPREMADES.Settings.manualRollsUsers.Name';
    let content = 'CHRISPREMADES.Settings.manualRollsUsers.Hint';
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
    genericUtils.setCPRSetting('manualRollsUsers', result);
}
async function evaluate(wrapped, options) {
    let gmID = socketUtils.gmID();
    if (genericUtils.getCPRSetting('manualRollsGMFulfils') && game.users.get(gmID)?.active && gmID != game.user.id) {
        let remoteRoll = await rollUtils.remoteRoll(this, gmID);
        this.terms = remoteRoll.terms;
        this._dice = remoteRoll._dice;
        this._evaluated = remoteRoll._evaluated;
        this._total = remoteRoll._total;
        return this;
    } else {
        if (this.terms[0].faces === 20 && !options?.['chris-premades']?.skipEvent && this.data.actorUuid) {
            await d20.preEvaluation(this, options);
            let roll = await wrapped(options);
            let testRoll = await d20.postEvaluation(roll, options);
            if (testRoll) return testRoll;
            return roll;
        } else {
            return await wrapped(options);
        }
    }
}
function patch(enabled) {
    if (enabled) {
        genericUtils.log('dev', 'Evaluate Roll Patched!');
        libWrapper.register('chris-premades', 'Roll.prototype.evaluate', evaluate, 'MIXED');
    } else {
        genericUtils.log('dev', 'Evaluate Roll Patch Removed!');
        libWrapper.unregister('chris-premades', 'Roll.prototype.evaluate');
    }
}
export let rollResolver = {
    registerFulfillmentMethod,
    unregisterFulfillmentMethod,
    manualRollsUsersDialog,
    patch
};