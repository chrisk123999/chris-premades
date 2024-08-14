import {genericUtils} from '../utils.js';

function missingPack() {
    genericUtils.notify('CHRISPREMADES.Error.CompendiumNotFound', 'warn');
}
function missingPackItem(key, name) {
    if (!key || !name) return;
    genericUtils.notify('CHRISPREMADES.Error.CompendiumItemNotFound' + ' ' + key + ': ' + name, 'warn');
}
export let errors = {
    missingPack,
    missingPackItem
};