import {constants, effectUtils, genericUtils} from '../utils.js';
import {conditions} from '../extensions/conditions.js';
let effectItem;
let effectCollection;
async function ready() {
    await checkEffectItem();
    let effects = effectItem.effects.contents;
    effectCollection = new EffectCollection(effects);
    function removeItem(directory) {
        if (!(directory instanceof foundry.applications.sidebar.tabs.ItemDirectory)) return;
        let html = directory.element;
        let li = html.querySelector('li[data-entry-id="' + effectItem.id + '"]');
        li?.remove();
    }
    Hooks.on('changeSidebarTab', removeItem);
    Hooks.on('renderItemDirectory', removeItem);
    Hooks.on('updateActiveEffect', updateEffect);
    patch(true);
    statusEffects();
}
function updateEffect(effect) {
    if (effect.parent?.uuid != effectItem?.uuid) return;
    let document = ui.effects.collection.contents.find(i => i.id === effect.id);
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
    ui.effects.render(true);
}
class EffectCollection extends foundry.documents.abstract.WorldCollection {
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
class EffectDirectory extends foundry.applications.sidebar.DocumentDirectory {
    static DEFAULT_OPTIONS = {
        collection: 'ActiveEffect',
        id: 'effects'
    };
    
    static tabName = 'effects';
    
    async _onRender(context, options) {
        await super._onRender(context, options);
        let list = this.element?.querySelectorAll('.directory-item') ?? [];
        effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (!effectItem) return;
        for (let li of list) {
            let effect = effectItem.effects.get(li.dataset.entryId);
            let tmp = document.implementation.createHTMLDocument('');
            tmp.body.innerHTML = '<img class="thumbnail" title="' + effect.name + '" src="' + effect.img + '">';
            let img = tmp.body.childNodes[0];
            li.prepend(img);
        }
    }

    _getEntryContextOptions() {
        function getDocument(li) {
            let entryId = li.dataset.entryId;
            let document = effectItem.effects.get(entryId);
            return document;
        }
        let options = [
            {
                callback: async (li) => {
                    let document = getDocument(li);
                    if (!document) return;
                    await document.sheet.render(true);
                },
                condition: () => game.user.isGM,
                icon: '<i class="fas fa-pencil"></i>',
                name: 'CHRISPREMADES.Generic.Edit'
            },
            {
                callback: async (li) => {
                    let document = getDocument(li);
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
                callback: async (li) => {
                    let document = getDocument(li);
                    if (!document) return;
                    await foundry.applications.api.DialogV2.confirm({
                        window: {
                            title: genericUtils.translate('CHRISPREMADES.EffectInterface.ImportData') + document.name
                        },
                        position: {
                            width: 400
                        },
                        // eslint-disable-next-line no-undef
                        content: await foundry.applications.handlebars.renderTemplate('templates/apps/import-data.hbs', {
                            hint1: game.i18n.format('DOCUMENT.ImportDataHint1', {document: 'ActiveEffect'}),
                            hint2: game.i18n.format('DOCUMENT.ImportDataHint2', {name: document.name})
                        }),
                        yes: {
                            icon: 'fa-solid fa-file-import',
                            label: genericUtils.translate('CHRISPREMADES.Generic.Import'),
                            callback: (event, button) => {
                                let form = button.form;
                                if (!form.data.files.length) return ui.notifications.error('DOCUMENT.ImportDataError', {localize: true});
                                foundry.utils.readTextFromFile(form.data.files[0]).then(json => {
                                    let data = JSON.parse(json);
                                    document.update(data);
                                });
                            },
                            default: true
                        },
                        no: {
                            icon: 'fa-solid fa-times',
                            label: genericUtils.translate('CHRISPREMADES.Generic.Cancel')
                        }
                    });
                },
                condition: () => game.user.isGM,
                icon: '<i class="fas fa-file-import"></i>',
                name: 'SIDEBAR.Import'
            },
            {
                callback: async (li) => {
                    let document = getDocument(li);
                    if (!document) return;
                    if (document.flags['chris-premades']?.effectInterface?.customStatus) CONFIG.statusEffects = CONFIG.statusEffects.filter(i => i._id != document.id);
                    this.collection.delete(document.id);
                    await document.delete();
                    this.render(true);
                },
                condition: (li) => {
                    let document = getDocument(li);
                    if (!document) return false;
                    if (!game.user.isGM) return false;
                    if (document.flags['chris-premades']?.effectInterface?.status && CONFIG.statusEffects.find(i => i?._id === document.id)) return false;
                    return true;
                },
                icon: '<i class="fas fa-trash"></i>',
                name: 'SIDEBAR.Delete'
            },
            {
                callback: async (li) => {
                    let document = getDocument(li);
                    if (!document) return;
                    let effectData = document.toObject();
                    delete effectData._id;
                    if (effectData.flags['chris-premades']?.effectInterface?.status) delete effectData.flags['chris-premades'].effectInterface.status;
                    effectData.name += ' ' + genericUtils.translate('CHRISPREMADES.EffectInterface.Copy');
                    genericUtils.setProperty(effectData, 'flags.chris-premades.effectInterface.sort', this.collection.size + 1);
                    let createdEffect = await ActiveEffect.create(effectData, {parent: effectItem});
                    this.collection.set(createdEffect);
                    this.render(true);
                },
                condition: () => game.user.isGM,
                icon: '<i class="far fa-copy"></i>',
                name: 'SIDEBAR.Duplicate'
            },
            {
                callback: async (li) => {
                    let document = getDocument(li);
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
                    this.collection.initializeTree();
                },
                condition: (li) => {
                    if (!game.user.isGM) return false;
                    let document = getDocument(li);
                    if (!document) return false;
                    if (document.flags['chris-premades']?.effectInterface?.status) return false;
                    return !document.flags['chris-premades']?.effectInterface?.customStatus;
                },
                icon: '<i class="fa-solid fa-universal-access"></i>',
                name: 'CHRISPREMADES.EffectInterface.StatusAdd'
            },
            {
                callback: async (li) => {
                    let document = getDocument(li);
                    if (!document) return;
                    let id = document.name.toLowerCase().slugify();
                    await genericUtils.update(document, {statuses: Array.from(document.statuses).filter(i => i != id), 'flags.chris-premades.effectInterface.customStatus': false});
                    CONFIG.statusEffects = CONFIG.statusEffects.filter(i => i._id != document.id);
                    this.collection.initializeTree();
                },
                condition: (li) => {
                    if (!game.user.isGM) return false;
                    let document = getDocument(li);
                    if (!document) return false;
                    if (document.flags['chris-premades']?.effectInterface?.status) return false;
                    return document.flags['chris-premades']?.effectInterface?.customStatus;
                },
                icon: '<i class="fa-solid fa-universal-access"></i>',
                name: 'CHRISPREMADES.EffectInterface.StatusRemove'
            }
        ];
        return options;
    }

    async _prepareDirectoryContext(context, options) {
        this.collection.initializeTree();
        await super._prepareDirectoryContext(context, options);
    }

    async _onClickEntry(event, target) {
        event.preventDefault();
        let entryId = target.parentElement.dataset.entryId;
        await effectUtils.toggleSidebarEffect(entryId);
    }

    get collection() {
        effectItem = game.items.find(i => i.flags['chris-premades']?.effectInterface);
        if (effectCollection) return effectCollection;
        if (effectItem) {
            let effects = effectItem.effects.contents;
            effectCollection = new EffectCollection(effects);
        } else {
            effectCollection = new EffectCollection([]);
        }
        effectCollection.initializeTree();
        return effectCollection;
    }

    _canCreateEntry() {
        return game.user.isGM;
    }

    _canCreateFolder() {
        return false;
    }

    async _onCreateEntry(event) {
        event.preventDefault();
        let effectData = {
            name: genericUtils.translate('DND5E.EffectNew'),
            img: 'icons/svg/aura.svg',
            transfer: false,
            flags: {
                'chris-premades': {
                    effectInterface: {
                        sort: this.collection.size + 1
                    }
                }
            }
        };
        let createdEffect = await ActiveEffect.create(effectData, {parent: effectItem});
        await createdEffect.sheet.render(true);
        this.collection.set(createdEffect);
        this.collection.initializeTree();
        this.render(true);
    }

    // TODO: see about this
    // _onRightClickTab(event) {
    //     event.preventDefault();
    //     return;
    // }

    _canDragStart(selector) {
        return true;
    }

    _canDragDrop(selector) {
        return true;
    }

    async _handleDroppedEntry(target, data) {
        if (!effectItem) return;
        if (data.type !== 'ActiveEffect') return;
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
            let createdEffect = await ActiveEffect.create(effectData, {parent: effectItem});
            this.collection.set(createdEffect);
            this.render(true);
        } catch (error) {
            console.error(error);
        }
    }

    _onDragStart(event) {
        let li = event.currentTarget;
        if (event.target.classList.contains('content-link')) return;
        let effectId = li.dataset.entryId;
        let effect = effectItem.effects.get(effectId);
        if (!effect) return;
        let dragData = effect.toDragData();
        if (!dragData) return;
        dragData.cprEffect = true;
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
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
async function fromStatusEffect(wrapped, statusId, options = {}) {
    if (options.passThrough || !effectItem) return wrapped(statusId, options);
    let effect = effectItem.effects.find(i => i.flags['chris-premades']?.effectInterface?.status === statusId);
    if (!effect) effect = effectItem.effects.find(i => i.flags['chris-premades']?.effectInterface?.customStatus === statusId);
    if (!effect) return await wrapped(statusId, options);
    let effectData = effect.toObject();
    delete effectData.origin;
    delete effectData._stats;
    delete effectData.parent;
    let fixedEffect = effectUtils.syntheticActiveEffect(effectData);
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
    let tabs = Object.entries(CONFIG.ui.sidebar.TABS);
    let macroIdx = tabs.findIndex(i => i[0] === 'macros');
    if (macroIdx === -1) macroIdx = tabs.length - 1;
    tabs.splice(macroIdx + 1, 0, ['effects', {
        tooltip: 'Effects',
        icon: 'fa-solid fa-bolt',
        gmOnly: false
    }]);
    CONFIG.ui.sidebar.TABS = Object.fromEntries(tabs);
    // Hooks.on('renderSidebar', effectSidebar);
    // Hooks.on('renderAbstractSidebarTab', effectSidebarTab);
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