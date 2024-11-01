import {constants, genericUtils, itemUtils} from '../utils.js';
import {DialogApp} from './dialog.js';
async function send(item, options) {
    if (!constants.itemTypes.includes(item.type)) return;
    let index = options.findIndex(i => i.name === 'DND5E.ContextMenuActionDuplicate');
    let position = index != -1 ? index + 1 : options.length;
    options.splice(position, 0, {
        name: 'CHRISPREMADES.Item.Send',
        icon: '<i class="fa-solid fa-hand-holding"></i>',
        callback: async () => {
            let actors = game.actors.filter(i => i.id != item.actor.id && (i.hasPlayerOwner || (i.type === 'group' && (i.ownership[game.user.id] >= 2 || i.ownership.default >= 2)))).map(j => ({
                label: j.name,
                name: j.id,
                options: {
                    minAmount: 0,
                    maxAmount: item.system.quantity
                }
            }));
            let selection = await DialogApp.dialog('CHRISPREMADES.Item.Send', 'CHRISPREMADES.Item.SelectAmount', [['selectAmount', actors, {displayAsRows: true, totalMax: item.system.quantity}]], 'okCancel');
            if (!selection?.buttons) return;
            delete selection.buttons;
            let itemData = genericUtils.duplicate(item.toObject());
            delete itemData._id;
            delete itemData.system.container;
            delete itemData.sort;
            let total = 0;
            await Promise.all(Object.entries(selection).map(async ([actorId, quantity]) => {
                quantity = Number(quantity);
                if (!quantity) return;
                let actor = game.actors.get(actorId);
                if (!actor) return;
                itemData.system.quantity = quantity;
                await itemUtils.createItems(actor, [itemData]);
                total += quantity;
            }));
            if (total === item.system.quantity) {
                await genericUtils.remove(item);
            } else {
                await genericUtils.update(item, {'system.quantity': item.system.quantity - total});
            }
        }
    });
    options.splice(position + 1, 0, {
        name: 'CHRISPREMADES.Item.Condense',
        icon: '<i class="fa-solid fa-arrows-to-dot"></i>',
        callback: async () => {
            let items = item.actor.items.filter(i => item.name === i.name && item.id != i.id);
            if (!items.length) return;
            let total = 0;
            items.forEach(i => total += i.system.quantity);
            if (!total) return;
            await genericUtils.deleteEmbeddedDocuments(item.actor, 'Item', items.map(i => i.id));
            await genericUtils.update(item, {'system.quantity': item.system.quantity + total});
        }
    });
    if (item.system.quantity >= 2) {
        options.splice(position + 2, 0, {
            name: 'CHRISPREMADES.Item.Split',
            icon: '<i class="fa-solid fa-divide"></i>',
            callback: async () => {
                let halfQuantity = Math.floor(item.system.quantity / 2);
                if (!halfQuantity) return;
                let itemData = genericUtils.duplicate(item.toObject());
                delete itemData._id;
                itemData.system.quantity = halfQuantity;
                await genericUtils.update(item, {'system.quantity': item.system.quantity - halfQuantity});
                await itemUtils.createItems(item.actor, [itemData]);
            }
        });
    }
}
export let item = {
    send
};