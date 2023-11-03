export function addDAEFlags() {
    let crFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CR.' + i);
    let cvFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CV.' + i);
    DAE.addAutoFields(crFlags.concat(cvFlags));
}
export function colorizeDAETitleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.open-item-effect');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let passiveEffect = !!object.effects.find(i => i.transfer);
    let transferEffect = !!object.effects.find(i => i.transfer === false);
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