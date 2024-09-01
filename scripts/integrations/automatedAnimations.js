let keys = [
    'aaAutorec-melee',
    'aaAutorec-range',
    'aaAutorec-ontoken',
    'aaAutorec-templatefx',
    'aaAutorec-aura',
    'aaAutorec-preset',
    'aaAutorec-aefx'
];
function getAutoRec(name) {
    return keys.map(i => {
        return game.settings.get('autoanimations', i).find(j => {
            return j.label.toLowerCase().includes(name.toLowerCase());
        });
    }).find(k => k);
}
function renderItemSheet(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.aaItemSettings');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let autoRec = getAutoRec(app.object.name);
    let isEnabled = object.flags?.autoanimations?.isEnabled ?? true;
    let isCustomized = object.flags?.autoanimations?.isCustomized ?? false;
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
function playItemSound(soundDetails) {
    new Sequence()
        .sound()
        .file(soundDetails.file)
        .startTime(soundDetails.startTime)
        .volume(soundDetails.volume)
        .delay(soundDetails.delay)
        .repeats(soundDetails.repeat, soundDetails.repeatDelay)
        .play();
}
async function aaSound(item, pass) {
    if (!game.modules.get('autoanimations')?.active) return;
    if (item.flags?.autoanimations?.isEnabled ?? true) return;
    let playOnDamage = game.settings.get('autoanimations', 'playonDamage');
    switch (pass) {
        case 'attack': if (item.hasAreaTarget || (item.hasDamage && playOnDamage)) return; break;
        case 'damage': if (item.hasAreaTarget || (item.hasAttack && !playOnDamage)) return; break;
        case 'done': if (item.hasAreaTarget || item.hasAttack || item.hasDamage) return; break;
    }
    let autoRec = getAutoRec(item.name);
    if (!autoRec) return;
    if (autoRec.primary?.sound?.enable) playItemSound(autoRec.primary.sound);
    if (autoRec.secondary?.sound?.enable) playItemSound(autoRec.secondary.sound);
}
export let automatedAnimations = {
    renderItemSheet,
    aaSound
};