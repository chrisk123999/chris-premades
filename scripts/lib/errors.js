import {genericUtils} from '../utils.js';

function missingPack() {
    genericUtils.notify('CHRISPREMADES.error.compendiumNotFound', 'warn');
}
function missingPackItem() {
    genericUtils.notify('CHRISPREMADES.error.compendiumItemNotFound', 'warn');
}
export let errors = {
    missingPack,
    missingPackItem
};