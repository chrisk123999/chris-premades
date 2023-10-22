let autoRecs;
function sortAutoRec() {
    function addItems(setting) {
        game.settings.get('autoanimations', setting).map(i => i.label.toLowerCase()).forEach(i => autoRecNames.add(i));
    }
    let settings = [
        'aaAutorec-melee',
        'aaAutorec-range',
        'aaAutorec-ontoken',
        'aaAutorec-templatefx',
        'aaAutorec-aura',
        'aaAutorec-preset',
        'aaAutorec-aefx'
    ];
    let autoRecNames = new Set();
    for (let setting of settings) addItems(setting);
    autoRecs = Array.from(autoRecNames);
}
function titleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.aaItemSettings');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let isEnabled = object.flags?.autoanimations?.isEnabled ?? true;
    let isCustomized = object.flags?.autoanimations?.isCustomized ?? false;
    let itemName = app.object.name.toLowerCase();
    let autoRec = false;
    if (autoRecs.find(i => i.includes(itemName))) autoRec = true;
    let color;
    if (!isEnabled && !autoRec && !isCustomized) {
        color = 'red';
    } else if (isEnabled && isCustomized && !autoRec) {
        color = 'green';
    } else if (isEnabled && isCustomized && autoRec) {
        color = 'dodgerblue';
    } else if (isEnabled && !isCustomized && autoRec) {
        color = 'orchid';
    } else if (!isEnabled && autoRec) {
        color = 'yellow';
    } else if (isEnabled && !autoRec) {
        color = 'orange';
    } else return;
    headerButton.style.color = color;
}
export let automatedAnimations = {
    'titleBarButton': titleBarButton,
    'sortAutoRec': sortAutoRec
}