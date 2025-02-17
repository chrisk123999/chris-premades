import {constants, effectUtils, genericUtils} from '../utils.js';
import {conditions} from '../extensions/conditions.js';
let effectItem;
let effectCollection;
async function ready() {
    await checkEffectItem();
    let effects = effectItem.effects.contents;
    effectCollection = new EffectCollection(effects);
    function removeItem(directory) {
        if (!(directory instanceof ItemDirectory)) return;
        let html = directory.element;
        let li = html.find('li[data-document-id="' + effectItem.id + '"]');
        li.remove();
    }
    Hooks.on('changeSidebarTab', removeItem);
    Hooks.on('renderItemDirectory', removeItem);
    Hooks.on('updateActiveEffect', updateEffect);
    patch(true);
    statusEffects();
}
function updateEffect(effect) {
    if (effect.parent?.uuid != effectItem?.uuid) return;
    let document = ui.sidebar.tabs.effects.documents.contents.find(i => i.id === effect.id);
    document.name = effect.name;
    if (document.flags['chris-premades']?.effectInterface.customStatus) {
        let id = effect.name.toLowerCase().slugify();
        let status = CONFIG.statusEffects.find(i => i._id === effect.id);
        if (status) {
            status.id = id;
            status.label = effect.name;
        }
        if (!effect.statuses.has(id)) genericUtils.update(effect, {statuses: [...Array.from(document.statuses), id]});
    }
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
    _getVisibleTreeContents() {
        return this.contents;
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
        function getDocument(header) {
            let documentId = header[0].dataset.documentId;
            let document = effectItem.effects.get(documentId);
            return document;
        }
        let options = [
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    await document.sheet.render(true);
                },
                condition: () => game.user.isGM,
                icon: '<i class="fas fa-pencil"></i>',
                name: 'CHRISPREMADES.Generic.Edit'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    let effectData = document.toObject();
                    delete effectData._id;
                    delete effectData.origin;
                    let tempEffect = new CONFIG.ActiveEffect.documentClass(effectData);
                    if (tempEffect) {
                        let data = tempEffect.toCompendium(null, options);
                        data.flags.exportSource = {
                            world: game.world.id,
                            system: game.system.id,
                            coreVersion: game.version,
                            systemVersion: game.system.version
                        };
                        let filename = ['fvtt', tempEffect.documentName, tempEffect.name?.slugify(), tempEffect.id].filterJoin('-');
                        // eslint-disable-next-line no-undef
                        saveDataToFile(JSON.stringify(data, null, 2), 'text/json', filename + '.json');
                    }
                },
                condition: () => game.user.isGM,
                icon: '<i class="fas fa-file-export"></i>',
                name: 'SIDEBAR.Export'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    async function modifiedImportFromJSON(json) {
                        let effectData = JSON.parse(json);
                        genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.sort', document.flags['chris-premades']?.effectInterface?.sort);
                        await document.update(effectData);
                        ui.sidebar.tabs.effects.render(true);
                    }
                    async function importDialog() {
                        new Dialog({
                            title: genericUtils.translate('CHRISPREMADES.EffectInterface.ImportData') + document.name,
                            // eslint-disable-next-line no-undef
                            content: await renderTemplate('templates/apps/import-data.html', {
                                hint1: game.i18n.format('DOCUMENT.ImportDataHint1', {'document': 'ActiveEffect'}),
                                hint2: game.i18n.format('DOCUMENT.ImportDataHint2', {'name': document.name})
                            }),
                            buttons: {
                                import: {
                                    icon: '<i class="fas fa-file-import"></i>',
                                    label: genericUtils.translate('CHRISPREMADES.Generic.Import'),
                                    callback: html => {
                                        let form = html.find('form')[0];
                                        if (!form.data.files.length) return ui.notifications.error('You did not upload a data file!');
                                        // eslint-disable-next-line no-undef
                                        readTextFromFile(form.data.files[0]).then(json => modifiedImportFromJSON(json));
                                    }
                                },
                                no: {
                                    icon: '<i class="fas fa-times"></i>',
                                    label: genericUtils.translate('CHRISPREMADES.Generic.Cancel')
                                }
                            },
                            default: 'import'
                        }, {
                            width: 400
                        }).render(true);
                    }
                    importDialog();
                },
                condition: () => game.user.isGM,
                icon: '<i class="fas fa-file-import"></i>',
                name: 'SIDEBAR.Import'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    if (document.flags['chris-premades']?.effectInterface?.customStatus) CONFIG.statusEffects = CONFIG.statusEffects.filter(i => i._id != document.id);
                    this.collection.delete(document.id);
                    await document.delete();
                    this.collection.render(true);
                },
                condition: (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    if (!game.user.isGM) return false;
                    if (document.flags['chris-premades']?.effectInterface?.status && CONFIG.statusEffects.find(i => i?._id === document.id)) return false;
                    return true;
                },
                icon: '<i class="fas fa-trash"></i>',
                name: 'SIDEBAR.Delete'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    let effectData = document.toObject();
                    delete effectData._id;
                    if (effectData.flags['chris-premades']?.effectInterface?.status) delete effectData.flags['chris-premades'].effectInterface.status;
                    effectData.name += ' ' + genericUtils.translate('CHRISPREMADES.EffectInterface.Copy');
                    genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.sort', this.collection.size + 1);
                    let createdEffect = await ActiveEffect.create(effectData, {'parent': effectItem});
                    this.collection.set(createdEffect);
                    this.render(true);
                },
                condition: () => game.user.isGM,
                icon: '<i class="far fa-copy"></i>',
                name: 'SIDEBAR.Duplicate'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    let id = document.name.toLowerCase().slugify();
                    await genericUtils.update(document, {statuses: [...Array.from(document.statuses), id], 'flags.chris-premades.effectInterface.customStatus': id});
                    CONFIG.statusEffects.push({
                        id: id,
                        img: document.img,
                        name: document.name,
                        _id: document.id,
                        customStatus: true
                    });
                },
                condition: (header) => {
                    if (!game.user.isGM) return;
                    let document = getDocument(header);
                    if (!document) return;
                    if (document.flags['chris-premades']?.effectInterface?.status) return;
                    return !document.flags['chris-premades']?.effectInterface?.customStatus;
                },
                icon: '<i class="fa-solid fa-universal-access"></i>',
                name: 'CHRISPREMADES.EffectInterface.StatusAdd'
            },
            {
                callback: async (header) => {
                    let document = getDocument(header);
                    if (!document) return;
                    let id = document.name.toLowerCase().slugify();
                    await genericUtils.update(document, {statuses: Array.from(document.statuses).filter(i => i != id), 'flags.chris-premades.effectInterface.customStatus': false});
                    CONFIG.statusEffects = CONFIG.statusEffects.filter(i => i._id != document.id);
                },
                condition: (header) => {
                    if (!game.user.isGM) return;
                    let document = getDocument(header);
                    if (!document) return;
                    if (document.flags['chris-premades']?.effectInterface?.status) return;
                    return document.flags['chris-premades']?.effectInterface?.customStatus;
                },
                icon: '<i class="fa-solid fa-universal-access"></i>',
                name: 'CHRISPREMADES.EffectInterface.StatusRemove'
            }
        ];
        return options;
    }
    async _onClickEntryName(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let documentId = element.parentElement.dataset.documentId;
        await effectUtils.toggleSidebarEffect(documentId);
    }
    static get collection() {
        effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
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
            'name': genericUtils.translate('DND5E.EffectNew'),
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
        dragData.cprEffect = true;
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }
    async _onCreateFolder(event) {
        event.preventDefault();
        event.stopPropagation();
        let createDialog = new Dialog({
            title: 'Create Folder',
            // eslint-disable-next-line no-undef
            content: await renderTemplate('templates/sidebar/folder-edit.html', {
                folder: {},
                sortingModes: {a: 'FOLDER.SortAlphabetical', m: 'FOLDER.SortManual'},
                submitText: genericUtils.translate('FOLDER.Create')
            }),
            buttons: {
                submit: {
                    icon: '<i class="fas fa-check"></i>',
                    label: genericUtils.translate('FOLDER.Create'),
                    callback: html => {
                        let folderName = html.find('input[name="name"]')?.[0]?.value;
                        if (!folderName || !folderName.length) folderName = Folder.implementation.defaultName();
                        let color = html.find('color-picker[name="color"]')?.[0]?.value;
                        if (!color || !color.length) color = null;
                        let sortingMode = html.find('input[name="sorting"]:checked')?.[0]?.value ?? 'a';

                    }
                }
            }
        }, {
            width: 400
        });
        createDialog.data.content = createDialog.data.content.replace('<button type="submit"><i class="fas fa-check"></i> ' + game.i18n.localize('FOLDER.Create') + '</button>', '');
        createDialog.render(true);
    }
}
function effectSidebar(app, html, data) {
    let width = Math.floor(parseInt(getComputedStyle(html[0]).getPropertyValue('--sidebar-width')) / (document.querySelector('#sidebar-tabs').childElementCount + 1));
    html[0].querySelector('#sidebar-tabs').style.setProperty('--sidebar-tab-width', width + 'px');
    let tab = document.createElement('a');
    tab.classList.add('item');
    tab.dataset.tab = 'effects';
    tab.dataset.tooltip = 'DND5E.Effects';
    if (!('tooltip' in game)) tab.title = genericUtils.translate('DND5E.Effects');
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
function effectHotbarDrop(hotbar, data, slot) {
    if (!data.cprEffect) return;
    let doc = fromUuidSync(data.uuid);
    // eslint-disable-next-line no-undef
    Macro.implementation.create({
        name: doc.name,
        type: CONST.MACRO_TYPES.SCRIPT,
        img: doc.img,
        command: `await chrisPremades.utils.effectUtils.toggleSidebarEffect('${doc.id}');`
    }).then((macro) => {
        game.user.assignHotbarMacro(macro, slot, {fromSlot: data.slot});
    });
    return false;
}
async function checkEffectItem() {
    effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
    if (!effectItem) {
        let itemData = {
            name: 'CPR Effect Interface Storage',
            img: constants.tempConditionIcon,
            type: 'feat',
            system: {
                description: {
                    value: genericUtils.translate('CHRISPREMADES.EffectInterface.Item')
                }
            },
            flags: {
                'chris-premades': {
                    effectInterface: true
                }
            }
        };
        effectItem = await Item.create(itemData);
    }
    let ignoreList = genericUtils.getCPRSetting('disableNonConditionStatusEffects') ? conditions.ignoredStatusEffects : [];
    ignoreList.push('exhaustion');
    let statusEffectDatas = (await Promise.all(CONFIG.statusEffects.filter(i => {
        if (!i._id?.includes('dnd')) return;
        if (ignoreList.includes(i.id)) return;
        return true;
    }).filter(k => !effectItem.effects.find(l => l.id === k._id)).map(async j => {
        let effectData = (await ActiveEffect.implementation.fromStatusEffect(j.id, {passThrough: true})).toObject();
        genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.status', j.id);
        delete effectData.origin;
        delete effectData._stats;
        return effectData;
    })));
    if (!statusEffectDatas.length) return;
    await genericUtils.createEmbeddedDocuments(effectItem, 'ActiveEffect', statusEffectDatas, {keepId: true, 'chris-premades': {ignore: true}});
}
function fromStatusEffect(wrapped, statusId, options = {}) {
    if (options.passThrough || !effectItem) return wrapped(statusId, options);
    let effect = effectItem.effects.find(i => i.flags['chris-premades']?.effectInterface?.status === statusId);
    if (!effect) effect = effectItem.effects.find(i => i.flags['chris-premades']?.effectInterface?.customStatus === statusId);
    if (!effect) return wrapped(statusId, options);
    let effectData = effect.toObject();
    delete effectData.origin;
    delete effectData._stats;
    let fixedEffect = effectUtils.syntheticActiveEffect(effectData, effectItem);
    return fixedEffect;
}
function patch(enabled) {
    if (enabled) {
        genericUtils.log('log', 'Status Effects Patched!');
        libWrapper.register('chris-premades', 'ActiveEffect.implementation.fromStatusEffect', fromStatusEffect, 'MIXED');
    } else {
        genericUtils.log('log', 'Status Effects Patch Removed!');
        libWrapper.unregister('chris-premades', 'ActiveEffect.implementation.fromStatusEffect');
    }
}
function init() {
    CONFIG.ui.effects = EffectDirectory;
    Hooks.on('renderSidebar', effectSidebar);
    Hooks.on('renderSidebarTab', effectSidebarTab);
    Hooks.on('hotbarDrop', effectHotbarDrop);
}
function statusEffects() {
    if (!effectItem) return;
    effectItem.effects.forEach(effect => {
        if (!effect.flags['chris-premades']?.effectInterface?.customStatus) return;
        CONFIG.statusEffects.push({
            id: effect.name.toLowerCase().slugify(),
            img: effect.img,
            name: effect.name,
            _id: effect.id,
            customStatus: true
        }); 
    });
}
export let effectInterface = {
    init,
    ready,
    patch,
    checkEffectItem
};