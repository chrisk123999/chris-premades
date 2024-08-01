import {genericUtils} from '../utils.js';

function missingPack() {
    genericUtils.notify('CHRISPREMADES.Error.CompendiumNotFound', 'warn');
}
function missingPackItem() {
    genericUtils.notify('CHRISPREMADES.Error.CompendiumItemNotFound', 'warn');
}
export let errors = {
    missingPack,
    missingPackItem
};