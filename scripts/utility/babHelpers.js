function spellPreparation(item) {
    if (item.type != 'spell') return false;
    return item.system.preparation.mode != 'atwill' && item.system.preparation.mode != 'innate';
}
export let bab = {
    'spellPreparation': spellPreparation
}