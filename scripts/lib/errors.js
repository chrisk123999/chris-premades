import {genericUtils} from '../utils.js';

function missingPack() {
    genericUtils.notify('CHRISPREMADES.Error.CompendiumNotFound', 'warn');
}
function missingPackItem(key, name) {
    if (!key || !name) return;
    genericUtils.notify('CHRISPREMADES.Error.CompendiumItemNotFound' + ' ' + key + ': ' + name, 'warn');
}
function missingActivity(identifier) {
    genericUtils.notify(genericUtils.format('CHRISPREMADES.Error.ActivityNotFound', {identifier}), 'warn');
}
export let errors = {
    missingPack,
    missingPackItem,
    missingActivity
};