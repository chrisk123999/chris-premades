import {DialogApp} from '../applications/dialog.js';
import {actorUtils, dialogUtils, genericUtils, itemUtils} from '../utils.js';
async function unlocked(pack) {
    let selection = await dialogUtils.buttonDialog(genericUtils.translate('CHRISPREMADES.Generic.CPR') + ': ' + pack.metadata.label, 'CHRISPREMADES.Medkit.Compendium.Apply', [['CHRISPREMADES.Generic.Yes', true], ['CHRISPREMADES.Generic.No', false]]);
    if (!selection) return;
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Start', 'info');
    let documents = await pack.getDocuments();
    if (pack.metadata.type === 'Actor') {
        for (let i of documents) await actorUtils.updateAll(i);
    } else if (pack.metadata.type === 'Item') {
        for (let i of documents) await itemUtils.itemUpdate(i);
    }
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Done', 'info');
}
async function locked(pack) {
    let sourceCompendiums = game.packs.contents.filter(i => i.metadata.type === pack.metadata.type && i.metadata.packName != 'chris-premades').map(j => ({
        label: j.metadata.label,
        value: j.metadata.id,
        isSelected: pack.metadata.id === j.metadata.id
    })).sort((a, b) => a.label.localeCompare(b.label, 'en', {sensitivity: 'base'}));
    let destinationCompendiums = game.packs.contents.filter(i => i.metadata.type === pack.metadata.type && i.metadata.packName != 'chris-premades' && !i.locked && i.metadata.id != pack.metadata.id).map(j => ({
        label: j.metadata.label,
        value: j.metadata.id
    })).sort((a, b) => a.label.localeCompare(b.label, 'en', {sensitivity: 'base'}));
    destinationCompendiums.unshift({
        label: 'CHRISPREMADES.Medkit.Compendium.NewCompendium',
        value: 'new'
    });
    let defaultDestinationCompendium;
    switch (pack.metadata.type) {
        case 'Item': {
            let index = await game.packs.get(pack.metadata.id)?.getIndex({fields: ['type']});
            let type = index.contents[0]?.type ?? 'item';
            switch (type) {
                case 'spell':
                    defaultDestinationCompendium = genericUtils.getCPRSetting('spellCompendium');
                    break;
                case 'weapon':
                case 'equipment':
                case 'consumable':
                case 'tool':
                case 'backpack':
                case 'loot':
                    defaultDestinationCompendium = genericUtils.getCPRSetting('itemCompendium');
                    break;
                case 'feat':
                default:
                    defaultDestinationCompendium = 'new';
                    break;
            }
            break;
        }
        case 'Actor': 
            defaultDestinationCompendium = genericUtils.getCPRSetting('monsterCompendium');
            break;
        default:
            defaultDestinationCompendium = 'new';
            break;
    }
    let testPack = game.packs.get(defaultDestinationCompendium);
    if (!testPack) defaultDestinationCompendium = 'new';
    let modes = [
        {
            label: 'CHRISPREMADES.Medkit.Compendium.MergeUpdate',
            value: 'mergeUpdate'
        },
        {
            label: 'CHRISPREMADES.Medkit.Compendium.Merge',
            value: 'merge'
        },
        {
            label: 'CHRISPREMADES.Medkit.Compendium.Overwrite',
            value: 'overwrite'
        }
    ];
    let selection = await DialogApp.dialog('CHRISPREMADES.Generic.CPR', '', [
        ['selectMany', [{label: 'CHRISPREMADES.Medkit.Compendium.sourceCompendiums', name: 'sourceCompendiums', options: {value: [pack.metadata.id], options: sourceCompendiums}}]],
        ['selectOption', [{label: 'CHRISPREMADES.Medkit.Compendium.DestinationCompendium', name: 'destinationCompendium', options: {currentValue: defaultDestinationCompendium, options: destinationCompendiums}}]],
        ['selectOption', [{label: 'CHRISPREMADES.Medkit.Compendium.Mode', name: 'mode', options: {currentValue: 'mergeUpdate', options: modes}}]],
    ], 'okCancel');
    if (!selection?.buttons || !selection.sourceCompendiums?.length) return;
    let destPack;
    if (selection.destinationCompendium === 'new') {
        let compendiumSelection = await DialogApp.dialog('CHRISPREMADES.Medkit.Compendium.NewCompendium', undefined, [
            ['text', [{label: 'CHRISPREMADES.Config.Name', name: 'name'}]]
        ], 'okCancel');
        if (!compendiumSelection?.buttons || compendiumSelection?.name === '' || !compendiumSelection?.name) return;
        try {
            // eslint-disable-next-line no-undef
            destPack = await CompendiumCollection.createCompendium({label: compendiumSelection.name, type: pack.metadata.type});
        } catch (error) {
            console.error(error);
            return;
        }
        selection.destinationCompendium = destPack.metadata.id;
    } else {
        destPack = game.packs.get(selection.destinationCompendium);
    }
    if (!destPack) return;
    if (destPack.locked) return;
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Start', 'info', {permanent: true});
    let toDelete = [];
    let destIndex = await destPack.getIndex({fields: ['name']});
    if (selection.mode === 'overwrite') {
        toDelete = destIndex.contents.map(i => i._id);
    } else {
        await Promise.all(selection.sourceCompendiums.map(async id => {
            let sourcePack = game.packs.get(id);
            if (!sourcePack) return;
            let sourceIndex = await sourcePack.getIndex({fields: ['name']});
            sourceIndex.contents.forEach(indexDoc => {
                let found = destIndex.contents.find(i => i.name === indexDoc.name);
                if (found) toDelete.push(found._id);
            });
        }));
    }
    genericUtils.log('log', 'Deleting old documents...');
    if (toDelete.length) {
        if (pack.metadata.type === 'Item') {
            await Item.deleteDocuments(toDelete, {pack: selection.destinationCompendium});
        } else if (pack.metadata.type === 'Actor') {
            await Actor.deleteDocuments(toDelete, {pack: selection.destinationCompendium});
        }
    }
    genericUtils.log('log', 'Done deleting old documents!');
    let documentDatas = [];
    await Promise.all(selection.sourceCompendiums.map(async id => {
        let sourcePack = game.packs.get(id);
        if (!sourcePack) return;
        let oldFolders = Array.from(sourcePack.folders?.values() ?? []).map(i => i.toObject());
        await Folder.createDocuments(oldFolders, {pack: selection.destinationCompendium, keepId: true});
        let sourceDocuments = await sourcePack.getDocuments();
        sourceDocuments.forEach(item => {
            if (sourceCompendiums.find(i => i.name === item.name)) return;
            let itemData = item.toObject();
            delete itemData._id;
            delete itemData.pack;
            documentDatas.push(itemData);
        });
    }));
    let createdDocuments;
    genericUtils.log('log', 'Creating new documents...');
    if (pack.metadata.type === 'Item') {
        createdDocuments = await Item.createDocuments(documentDatas, {pack: selection.destinationCompendium});
    } else if (pack.metadata.type === 'Actor') {
        createdDocuments = await Actor.createDocuments(documentDatas, {pack: selection.destinationCompendium});
    }
    if (!createdDocuments?.length) return;
    genericUtils.log('log', 'Done creating new documents!');
    if (selection.mode === 'mergeUpdate') {
        await destPack.getDocuments();
        createdDocuments = destPack.contents;
    }
    genericUtils.log('log', 'Updating documents...');
    await Promise.all(createdDocuments.map(async document => {
        try {
            if (pack.metadata.type === 'Item') {
                await itemUtils.itemUpdate(document);
            } else if (pack.metadata.type === 'Actor') {
                await actorUtils.updateAll(document);
            }
        } catch (error) {
            genericUtils.log('log', 'Error updating: ' + document.name);
            console.error(error);
        }
    }));
    genericUtils.log('log', 'Done updating documents!');
    ui.notifications.clear();
    genericUtils.notify('CHRISPREMADES.Medkit.Compendium.Done', 'info');
}
export let compendium = {
    unlocked,
    locked
};