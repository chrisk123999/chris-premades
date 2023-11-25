function titleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.babonus');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let api = game.modules.get('babonus')?.api;
    if (!api) return;
    let bonuses = api.getIds(object).length > 0;
    let effectBonus = !!object.effects.find(i => api.getIds(i).length > 0);
    let color;
    if (bonuses && !effectBonus) {
        color = 'green';
    } else if (!bonuses && effectBonus) {
        color = 'dodgerblue';
    } else if (bonuses && effectBonus) {
        color = 'orchid';
    } else return;
    headerButton.style.color = color;
}
function daeTitleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.babonus');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let api = game.modules.get('babonus')?.api;
    if (!api) return;
    let bonuses = api.getIds(object).length > 0;
    if (!bonuses) return;
    headerButton.style.color = 'green';
}
function actorTitleBarButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.babonus');
    if (!headerButton) return;
    let object = app.object;
    if (!object) return;
    let api = game.modules.get('babonus')?.api;
    if (!api) return;
    let bonuses = api.getIds(object).length > 0;
    if (!bonuses) return;
    headerButton.style.color = 'green';
}
function spellFeature(item) {
    return item.type === 'spell' || item.flags?.['chris-premades']?.spell?.castData;
}
let filters = {
    'spellFeature': spellFeature
}
function overlappingEffects(bonuses, object, details, hookType) {
    if (!bonuses.length) return;
    let overlappingAuras = new Set();
    for (let i of bonuses) {
        if (!i.aura.enabled) continue;
        if (overlappingAuras.has(i.name)) continue;
        if (i.bonus === '') continue;
        let auras = bonuses.filter(b => b.name === i.name && i.bonuses.bonus != '');
        if (auras.length > 1) overlappingAuras.add(i.name);
    }
    if (!overlappingAuras.size) return;
    let removeUuids = [];
    for (let i of Array.from(overlappingAuras)) {
        let evaluatedBonuses = bonuses.filter(b => b.name === i && b.bonuses.bonus != '').map(j => ({'uuid': j.uuid, 'value': new Roll(j.bonuses.bonus, j.getRollData()).evaluate({'async': false, 'maximize': true}).total}));
        let maxValue = Math.max(...evaluatedBonuses.map(i => i.value));
        let selectedBonus = evaluatedBonuses.find(i => i.value === maxValue);
        let removed = evaluatedBonuses.filter(i => i.uuid != selectedBonus.uuid);
        removeUuids.push(...removed.map(i => i.uuid));
    }
    removeUuids.forEach(uuid => bonuses.findSplice(bonus => bonus.uuid === uuid));
}
export let buildABonus = {
    'titleBarButton': titleBarButton,
    'daeTitleBarButton': daeTitleBarButton,
    'actorTitleBarButtons': actorTitleBarButton,
    'filters': filters,
    'overlappingEffects': overlappingEffects
}