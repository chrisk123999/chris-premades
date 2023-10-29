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
export let buildABonus = {
    'titleBarButton': titleBarButton,
    'daeTitleBarButton': daeTitleBarButton,
    'actorTitleBarButtons': actorTitleBarButton,
    'filters': filters
}