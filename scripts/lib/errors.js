function missingPack() {
    ui.notifications.warn('CHRISPREMADES.error.compendiumNotFound', {localize: true});
}
function missingPackItem() {
    ui.notifications.warn('CHRISPREMADES.error.compendiumItemNotFound', {localize: true});
}
export let errors = {
    missingPack,
    missingPackItem
};