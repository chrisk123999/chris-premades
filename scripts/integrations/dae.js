function addFlags() {
    let crFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CR.' + i);
    let cvFlags = Object.keys(CONFIG.DND5E.conditionTypes).map(i => 'flags.chris-premades.CV.' + i);
    DAE.addAutoFields(crFlags.concat(cvFlags));
}
function renderItemSheet(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('.dae-config-itemsheet');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let passiveEffect = !!object.effects.find(i => i.transfer && !i.flags.dnd5e?.type != 'enchantment');
    let transferEffect = !!object.effects.find(i => !i.transfer && !i.flags.dnd5e?.type != 'enchantment');
    let enchantmentEffect = !!object.effects.find(i => i.flags.dnd5e?.type === 'enchantment');
    let color;
    if (passiveEffect && !transferEffect && !enchantmentEffect) {
        color = 'dodgerblue';
    } else if (transferEffect && !passiveEffect && !enchantmentEffect) {
        color = 'green';
    } else if (transferEffect && passiveEffect && !enchantmentEffect) {
        color = 'orchid';
    } else if (passiveEffect && !transferEffect && enchantmentEffect) {
        color = 'orange';
    } else if (!passiveEffect && !passiveEffect && enchantmentEffect) {
        color = 'pink';
    } else if (transferEffect && passiveEffect && enchantmentEffect) {
        color = 'brown';
    } else return;
    headerButton.style.color = color;
}
export let dae = {
    addFlags,
    renderItemSheet
};