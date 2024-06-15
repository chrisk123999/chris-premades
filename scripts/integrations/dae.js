function addFlags() {

}
function renderItemSheet(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('.dae-config-itemsheet');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let passiveEffect = !!object.effects.find(i => i.transfer);
    let transferEffect = !!object.effects.find(i => !i.transfer);
    let color;
    if (passiveEffect && !transferEffect) {
        color = 'dodgerblue';
    } else if (transferEffect && !passiveEffect) {
        color = 'green';
    } else if (transferEffect && passiveEffect) {
        color = 'orchid';
    } else return;
    headerButton.style.color = color;
}
export let dae = {
    addFlags,
    renderItemSheet
};