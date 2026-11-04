import {actorUtils, genericUtils, itemUtils, summonUtils} from '../../proxy.mjs';
async function use({document: item, workflow}) {
    const stored = item.flags.cat?.storedItem;
    if (!stored?.uuid) return;
    const source = await fromUuid(stored.uuid);
    if (!source) return genericUtils.notify('CHRISPREMADES.Macros.Generic.StoredItem.Missing', {type: 'warn'});
    if (source.documentName === 'Actor') {
        const token = workflow.token?.document ?? actorUtils.getFirstToken(workflow.actor);
        const summons = [];
        for (let i = 0; i < (stored.count ?? 1); i++) summons.push(await summonUtils.createSummon(workflow.actor, source, {name: source.name}));
        if (token) await summonUtils.placeSummons(summons.filter(Boolean), 30, {token});
        return;
    }
    const itemData = genericUtils.mergeObject(source.toObject(), stored.updates ?? {}, {inplace: false});
    delete itemData._id;
    if (stored.quantity) itemData.system.quantity = stored.quantity;
    await itemUtils.createItems(workflow.actor, [itemData]);
}
/**
 * Turns a patch or card into the item or creatures it stores when it is used.
 * Bound on an item. Fires on `itemRollFinished`.
 * The item stores its contents in `flags.cat.storedItem`: `uuid` of an item or actor, plus `quantity`, `updates` for an item, or `count` for creatures.
 */
export const storedItem = {
    rules: 'all',
    version: '2.1.7',
    category: 'utility',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
