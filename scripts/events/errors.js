import {genericUtils} from '../utilities/genericUtils.js';
function missingPack() {
    ui.notifications.warn(genericUtils.translate('CHRISPREMADES.error.missingPack'));
}
function missingPackItem() {
    ui.notifications.warn(genericUtils.translate('CHRISPREMADES.error.missingPackItem'));
}
export let errors = {
    missingPack,
    missingPackItem
};