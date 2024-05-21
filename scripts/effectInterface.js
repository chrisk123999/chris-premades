let effectItem;
async function startup() {
    effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
    if (!effectItem) {
        let itemData = {
            'name': 'CPR Effect Interface Storage',
            'img': 'icons/magic/time/arrows-circling-green.webp',
            'type': 'feat',
            'flags': {
                'chris-premades': {
                    'effectInterface': true
                }
            }
        };
        effectItem = await Item.create(itemData);
    }
    Hooks.on('changeSidebarTab', (directory) => {
        // eslint-disable-next-line no-undef
        if (!(directory instanceof ItemDirectory)) return;
        let html = directory.element;
        let li = html.find('li[data-document-id="' + effectItem.id + '"]');
        li.remove();
    });
}
// eslint-disable-next-line no-undef
class CPREffects extends WorldCollection {
    static documentName = 'ActiveEffect';
}
class CPREffectInterface extends DocumentDirectory {
    static documentName = 'Effect';
    activateListeners(html) {
        super.activateListeners(html);
        html[0].querySelectorAll('.directory-list .thumbnail, .directory-list .profile').forEach(el => {
            el.classList.add('sidebar-effects-execute');
            el.addEventListener('click', this._onClickThumbnail.bind(this));
        });
    }
    _getEntryContextOptions() {
        let options = super._getEntryContextOptions();
        return options;
    }
    _onClickThumbnail(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let documentId = element.parentElement.dataset.documentId ?? element.parentElement.dataset.entityId;
        let document = this.collection.get(documentId);
        console.log(document);
    }
    static get collection() {
        console.log(effectItem);
        let effects = effectItem?.effects?.contents ?? [];
        console.log(effects);
        return new CPREffects(effects);
    }
    get tabName() {
        return 'effects';
    }
    get id() {
        return 'effects';
    }
    initialize() {
        this.folders = null;
        this.documents = this.collection;
        //this.collection.initializeTree();
    }
    get canCreateEntry() {
        return game.user.isGM;
    }
}
function effectSidebar(app, html, data) {
    let width = Math.floor(parseInt(getComputedStyle(html[0]).getPropertyValue('--sidebar-width')) / (document.querySelector('#sidebar-tabs').childElementCount + 1));
    html[0].querySelector('#sidebar-tabs').style.setProperty('--sidebar-tab-width', width + 'px');
    let tab = document.createElement('a');
    tab.classList.add('item');
    tab.dataset.tab = 'effects';
    tab.dataset.tooltip = 'DOCUMENT.ActiveEffect';
    if (!('tooltip' in game)) tab.title = 'Effects';
    let icon = document.createElement('i');
    icon.setAttribute('class', 'fas fa-hand-sparkles');
    tab.append(icon);
    if (!document.querySelector('#sidebar-tabs > [data-tab="effects"]')) document.querySelector('#sidebar-tabs > [data-tab="compendium"]').before(tab);
}
function effectSidebarTab(app, html, data) {
    if (app.tabName === 'effects' && !app.popOut) {
        if (document.querySelectorAll('#effects').length <= 1) document.querySelector('#sidebar').append(html[0]);
        document.querySelector('#effects').classList.add('tab');
        html[0].style.display = '';
    }
}
function enable() {
    CONFIG.ui.cprEffectInterface = CPREffectInterface;
    Hooks.on('renderSidebar', effectSidebar);
    Hooks.on('renderSidebarTab', effectSidebarTab);
}
export let effectInterface = {
    'startup': startup,
    'enable': enable
};