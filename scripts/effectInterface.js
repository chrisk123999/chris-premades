import {chris} from './helperFunctions.js';
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
    Hooks.on('updateActiveEffect', reRender);
}
function reRender(effect) {
    if (effect.parent?.uuid != effectItem?.uuid) return;
    ui.sidebar.tabs.effects.render(true);
    //ui.sidebar.render(true);
}
// eslint-disable-next-line no-undef
class CPREffects extends WorldCollection {
    static documentName = 'ActiveEffect';
    static _sortStandard(a, b) {
        return a.name.localeCompare(b.name);
    }
    set(document) {
        super.set(document.id, document);
        this._source.push(document.toObject());
    }
}
class CPREffectInterface extends DocumentDirectory {
    static documentName = 'Effect';
    activateListeners(html) {
        super.activateListeners(html);
        let list = html[0].querySelectorAll('.directory-item');
        effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (!effectItem) return;
        list.forEach(i => {
            let effect = effectItem.effects.get(i.dataset.documentId);
            // eslint-disable-next-line no-undef
            let img = jQuery.parseHTML('<img class="thumbnail" title="' + effect.name + '" src="' + effect.icon + '">');
            i.prepend(img[0]);
        });
    }
    _getEntryContextOptions() {
        let options = [
            {
                'callback': async (header) => {
                    let documentId = header[0].dataset.documentId;
                    let document = effectItem.effects.get(documentId);
                    if (document) await document.sheet.render(true);
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="fas fa-pencil"></i>',
                'name': 'Edit'
            },
            {
                'callback': async (header) => {
                    let documentId = header[0].dataset.documentId;
                    let document = effectItem.effects.get(documentId);
                    if (document) {
                        this.collection.delete(documentId);
                        await document.delete();
                        this.collection.render(true);
                    }
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="fas fa-trash"></i>',
                'name': 'SIDEBAR.Delete'
            },
            {
                'callback': async (header) => {
                    let documentId = header[0].dataset.documentId;
                    let document = effectItem.effects.get(documentId);
                    if (document) {
                        let effectData = document.toObject();
                        delete effectData._id;
                        effectData.name += ' (Copy)';
                        setProperty(effectData, 'flags.chris-premades.effectInterface.sort', this.collection.size + 1);
                        // eslint-disable-next-line no-undef
                        let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
                        this.collection.set(createdEffect);
                        this.render(true);
                    }
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="far fa-copy"></i>',
                'name': 'SIDEBAR.Duplicate'
            },
        ];
        return options;
    }
    async _onClickEntryName(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let documentId = element.parentElement.dataset.documentId;
        let document = this.collection.get(documentId);
        let selectedTokens = canvas.tokens.controlled;
        if (!selectedTokens.length) {
            ui.notifications.info('Please select a token first!');
            return;
        }
        let effectData = document.toObject();
        delete effectData.id;
        selectedTokens.forEach(i => {
            if (i.actor) chris.createEffect(i.actor, effectData);
        });
    }
    static get collection() {
        let effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (effectItem) {
            let effects = effectItem.effects.contents;
            effectCollection = new CPREffects(effects);
        } else {
            effectCollection = new CPREffects([]);
        }
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
        this.collection.initializeTree();
    }
    get canCreateEntry() {
        return game.user.isGM;
    }
    get canCreateFolder() {
        return false;
    }
    async _onCreateEntry(event) {
        event.preventDefault();
        let effectData = {
            'name': 'New Effect',
            'icon': 'icons/svg/aura.svg',
            'transfer': false,
            'flags': {
                'chris-premades': {
                    'effectInterface': {
                        'sort': this.collection.size + 1
                    }
                }
            }
        };
        // eslint-disable-next-line no-undef
        let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
        await createdEffect.sheet.render(true);
        this.collection.set(createdEffect);
        this.render(true);
    }
    _onRightClickTab(event) {
        event.preventDefault();
        return;
    }
    _canDragStart(selector) {
        return true;
    }
    _canDragStop(selector) {
        return false;
    }
    async _handleDroppedEntry(target, data) {
        if (!effectItem) return;
        let originEntity = await fromUuid(data.uuid);
        if (!originEntity) return;
        // eslint-disable-next-line no-undef
        if (!(originEntity instanceof ActiveEffect)) return;
        let effectData = originEntity.toObject();
        delete effectData._id;
        // eslint-disable-next-line no-undef
        let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
        this.collection.set(createdEffect);
        this.render(true);
    }
    _onDragStart(event) {
        const li = event.currentTarget;
        console.log(event);
        console.log(li);
        if ( event.target.classList.contains('content-link') ) return;
    
        let dragData = effect.toDragData(); //Finish this
        console.log(dragData);
        if ( !dragData ) return;
    
        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
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