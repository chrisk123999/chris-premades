import {actorUtils, effectUtils, genericUtils} from '../utils.js';
let effectItem;
let effectCollection;
async function ready() {
    effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
    if (!effectItem) {
        let itemData = {
            'name': 'CPR Effect Interface Storage',
            'img': 'icons/magic/time/arrows-circling-green.webp',
            'type': 'feat',
            'system': {
                'description': {
                    'value': genericUtils.translate('CHRISPREMADES.effectInterface.item')
                }
            },
            'flags': {
                'chris-premades': {
                    'effectInterface': true
                }
            }
        };
        effectItem = await Item.create(itemData);
    }
    let effects = effectItem.effects.contents;
    effectCollection = new EffectCollection(effects);
    Hooks.on('changeSidebarTab', (directory) => {
        if (!(directory instanceof ItemDirectory)) return;
        let html = directory.element;
        let li = html.find('li[data-document-id="' + effectItem.id + '"]');
        li.remove();
    });
    Hooks.on('updateActiveEffect', reRender);
}
function reRender(effect) {
    if (effect.parent?.uuid != effectItem?.uuid) return;
    ui.sidebar.tabs.effects.render(true);
}
class EffectCollection extends WorldCollection {
    static documentName = 'ActiveEffect';
    static _sortStandard(a, b) {
        let aNumber = a.flags['chris-premades']?.effectInterface?.sort ?? Number.MAX_SAFE_INTEGER;
        let bNumber = b.flags['chris-premades']?.effectInterface?.sort ?? Number.MAX_SAFE_INTEGER;
        return aNumber - bNumber;
    }
    set(document) {
        super.set(document.id, document);
        this._source.push(document.toObject());
    }
}
class EffectDirectory extends DocumentDirectory {
    static documentName = 'Effect';
    activateListeners(html) {
        super.activateListeners(html);
        let list = html[0].querySelectorAll('.directory-item');
        effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (!effectItem) return;
        list.forEach(i => {
            let effect = effectItem.effects.get(i.dataset.documentId);
            let img = jQuery.parseHTML('<img class="thumbnail" title="' + effect.name + '" src="' + effect.img + '">');
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
                'name': 'CHRISPREMADES.edit'
            },
            {
                'callback': async (header) => {
                    let documentId = header[0].dataset.documentId;
                    let document = effectItem.effects.get(documentId);
                    if (!document) return;
                    let effectData = document.toObject();
                    delete effectData._id;
                    delete effectData.origin;
                    let tempEffect = new CONFIG.ActiveEffect.documentClass(effectData);
                    if (tempEffect) return tempEffect.exportToJSON();
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="fas fa-file-export"></i>',
                'name': 'SIDEBAR.Export'
            },
            {
                'callback': async (header) => {
                    let documentId = header[0].dataset.documentId;
                    let document = effectItem.effects.get(documentId);
                    if (!document) return;
                    async function modifiedImportFromJSON(json) {
                        let effectData = JSON.parse(json);
                        genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.sort', document.flags['chris-premades']?.effectInterface?.sort);
                        await document.update(effectData);
                        ui.sidebar.tabs.effects.render(true);
                    }
                    async function importDialog() {
                        new Dialog({
                            title: genericUtils.translate('CHRISPREMADES.effectInterface.importData') + document.name,
                            // eslint-disable-next-line no-undef
                            content: await renderTemplate('templates/apps/import-data.html', {
                                hint1: game.i18n.format('DOCUMENT.ImportDataHint1', {'document': 'ActiveEffect'}),
                                hint2: game.i18n.format('DOCUMENT.ImportDataHint2', {'name': document.name})
                            }),
                            buttons: {
                                import: {
                                    icon: '<i class="fas fa-file-import"></i>',
                                    label: genericUtils.translate('CHRISPREMADES.import'),
                                    callback: html => {
                                        const form = html.find('form')[0];
                                        if (!form.data.files.length ) return ui.notifications.error('You did not upload a data file!');
                                        // eslint-disable-next-line no-undef
                                        readTextFromFile(form.data.files[0]).then(json => modifiedImportFromJSON(json));
                                    }
                                },
                                no: {
                                    icon: '<i class="fas fa-times"></i>',
                                    label: genericUtils.translate('CHRISPREMADES.Cancel')
                                }
                            },
                            default: 'import'
                        }, {
                            width: 400
                        }).render(true);
                    }
                    importDialog();
                },
                'condition': () => game.user.isGM,
                'icon': '<i class="fas fa-file-import"></i>',
                'name': 'SIDEBAR.Import'
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
                        genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.sort', this.collection.size + 1);
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
            ui.notifications.info(genericUtils.translate('CHRISPREMADES.effectInterface.selectToken'));
            return;
        }
        let effectData = document.toObject();
        delete effectData.id;
        genericUtils.setProperty(effectData, 'duration.startTime', game.time.worldTime);
        genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.id', document.id);
        selectedTokens.forEach(i => {
            if (!i.actor) return;
            let effect = actorUtils.getEffects(i.actor).find(i => i.flags['chris-premades']?.effectInterface?.id === document.id);
            if (effect) {
                genericUtils.remove(effect);
            } else {
                effectUtils.createEffect(i.actor, effectData);
            }
        });
    }
    static get collection() {
        let effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (effectItem) {
            let effects = effectItem.effects.contents;
            effectCollection = new EffectCollection(effects);
        } else {
            effectCollection = new EffectCollection([]);
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
            'name': genericUtils.translate('CHRISPREMADES.effectInterface.newEffect'),
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
        return true;
    }
    async _handleDroppedEntry(target, data) {
        if (!effectItem) return;
        if (data.type != 'ActiveEffect') return;
        let effectData;
        if (data.uuid) {
            let originEntity = await fromUuid(data.uuid);
            if (!originEntity) return;
            if (originEntity.parent?.uuid === effectItem.uuid) return;
            if (!(originEntity instanceof ActiveEffect)) return;
            effectData = originEntity.toObject();
        } else if (data.data) {
            effectData = data.data;
        }
        delete effectData._id;
        try {
            let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
            this.collection.set(createdEffect);
            this.render(true);
        } catch (error) {
            console.error(error);
        }
    }
    _onDragStart(event) {
        let li = event.currentTarget;
        if (event.target.classList.contains('content-link')) return;
        let effectId = li.dataset.documentId;
        let effect = effectItem.effects.get(effectId);
        if (!effect) return;
        let dragData = effect.toDragData();
        if (!dragData) return;
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }
}
function effectSidebar(app, html, data) {
    let width = Math.floor(parseInt(getComputedStyle(html[0]).getPropertyValue('--sidebar-width')) / (document.querySelector('#sidebar-tabs').childElementCount + 1));
    html[0].querySelector('#sidebar-tabs').style.setProperty('--sidebar-tab-width', width + 'px');
    let tab = document.createElement('a');
    tab.classList.add('item');
    tab.dataset.tab = 'effects';
    tab.dataset.tooltip = 'CHRISPREMADES.effectInterface.effects';
    if (!('tooltip' in game)) tab.title = genericUtils.translate('CHRISPREMADES.effectInterface.effects');
    let icon = document.createElement('i');
    icon.setAttribute('class', 'fas fa-bolt');
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
function init() {
    CONFIG.ui.cprEffectInterface = EffectDirectory;
    Hooks.on('renderSidebar', effectSidebar);
    Hooks.on('renderSidebarTab', effectSidebarTab);
}
export let effectInterface = {
    init,
    ready
};