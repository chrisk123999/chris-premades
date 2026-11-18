import {actorUtils, documentUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
const identifier = 'martial-adept-pool';
async function enchant(item, adept, changes) {
    const existing = documentUtils.getEffectByIdentifier(item, identifier);
    if (existing && foundry.utils.equals(existing.system.changes.map(({key, value}) => ({key, value})), changes.map(({key, value}) => ({key, value})))) return;
    if (existing) await documentUtils.deleteDocument(existing);
    if (!adept || !changes.length) return;
    await itemUtils.enchantItem(item, documentUtils.getBaseEffectData(adept, {
        name: adept.name,
        img: adept.img,
        origin: adept.uuid,
        identifier,
        parentEntity: adept,
        changes
    }));
}
function consumptionChanges(maneuver) {
    return Object.values(maneuver._source.system.activities).filter(activity => activity.consumption.targets.some(target => target.target === 'feat:superiority-dice')).map(activity => ({
        key: 'system.activities.' + activity._id + '.consumption.targets',
        type: 'override',
        value: genericUtils.duplicate(activity.consumption.targets).map(target => target.target === 'feat:superiority-dice' ? {...target, target: 'feat:martial-adept'} : target),
        phase: 'initial',
        priority: 20
    }));
}
async function sync({document: item}) {
    const actor = item.actor;
    if (!actor) return;
    const adept = actorUtils.getItemByIdentifier(actor, 'martial-adept');
    const dice = actorUtils.getItemByIdentifier(actor, 'superiority-dice');
    for (const maneuver of actor.items.filter(candidate => candidate.system.type?.subtype === 'maneuver')) await enchant(maneuver, adept && !dice ? adept : undefined, consumptionChanges(maneuver));
    if (dice) await enchant(dice, adept, [{key: 'system.uses.max', type: 'override', value: '{} + 1', phase: 'initial', priority: 20}]);
}
const item = [
    {
        pass: 'created',
        macro: sync,
        priority: 50
    },
    {
        pass: 'medkit',
        macro: sync,
        priority: 50
    },
    {
        pass: 'munched',
        macro: sync,
        priority: 50
    }
];
export const martialAdept = {
    name: 'Martial Adept',
    version: '2.1.9',
    rules: '2014',
    item
};
export const martialAdeptPool = {
    name: 'Martial Adept: Pool',
    version: '2.1.9',
    rules: '2014',
    item: [item[0]]
};
