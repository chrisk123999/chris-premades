let effectItem;
let effectCollection;
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
    let effects = effectItem.effects.contents;
    effectCollection = new CPREffects(effects);
    Hooks.on('changeSidebarTab', (directory) => {
        // eslint-disable-next-line no-undef
        if (!(directory instanceof ItemDirectory)) return;
        let html = directory.element;
        let li = html.find('li[data-document-id="' + effectItem.id + '"]');
        //li.remove();
    });
}
// eslint-disable-next-line no-undef
class CPREffects extends WorldCollection {
    static documentName = 'ActiveEffect';
    static _sortStandard(a, b) {
        return a.name.localeCompare(b.name);
    }
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
        let options = [
            {
                'callback': async (header) => {
                    console.log(header);
                    let documentId = header[0].dataset.documentId;
                    console.log(documentId);
                    let document = effectItem.effects.get(documentId);
                    console.log(document);
                    if (document) await document.delete();
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="fas fa-trash"></i>',
                'name': 'SIDEBAR.Delete'
            },
            {
                'callback': (header) => {
                    console.log(header);
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="far fa-copy"></i>',
                'name': 'SIDEBAR.Duplicate'
            },
        ];
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
        let effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (effectItem) {
            let effects = effectItem.effects.contents;
            effectCollection = new CPREffects(effects);
        } else {
            effectCollection = new CPREffects([]);
        }
        console.log(effectCollection);
        return effectCollection;
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
        console.log(this.collection);
        this.collection.initializeTree();
    }
    get canCreateEntry() {
        return game.user.isGM;
    }
    get canCreateFolder() {
        return false;
    }
    async _onClickEntryName(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let documentId = element.parentElement.dataset.documentId;
        let document = effectItem.effects.get(documentId);
        if (document) document.sheet.render(true);
    }
    async _onCreateEntry(event) {
        event.preventDefault();
        //event.stopPropagation();
        /*
        const button = event.currentTarget;
        const li = button.closest('.directory-item');
        const data = {folder: li?.dataset?.folderId};

        const cls = 'ActiveEffect';
        */
        let effectData = {
            'name': 'New Effect',
            'icon': 'icons/svg/aura.svg',
            'transfer': false
        };
        // eslint-disable-next-line no-undef
        let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
        await createdEffect.sheet.render(true);
        console.log(effectCollection);
        //Make this refresh or update the sidebar somehow?
    }
    _onRightClickTab(event) {
        event.preventDefault();
        return;
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