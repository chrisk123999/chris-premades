import {actorUtils, documentUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
const identifier = 'martial-adept-pool';
async function enchant(item, adept, changes) {
    const existing = item.effects.filter(effect => documentUtils.getIdentifier(effect) === identifier);
    if (existing.length === 1 && foundry.utils.equals(existing[0].system.changes.map(({key, value}) => ({key, value})), changes.map(({key, value}) => ({key, value})))) return;
    for (const effect of existing) await documentUtils.deleteDocument(effect);
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
const pools = ['martial-adept', 'fighting-style-superior-technique'];
function consumptionChanges(maneuver, primary) {
    return Object.values(maneuver._source.system.activities).filter(activity => activity.consumption.targets.some(target => target.target === 'feat:superiority-dice')).map(activity => ({
        key: 'system.activities.' + activity._id + '.consumption.targets',
        type: 'override',
        value: genericUtils.duplicate(activity.consumption.targets).map(target => target.target === 'feat:superiority-dice' ? {...target, target: 'feat:' + primary} : target),
        phase: 'initial',
        priority: 20
    }));
}
function poolChanges(pool, primary) {
    const changes = Object.values(pool._source.system.activities).filter(activity => activity.consumption.targets.some(target => target.type === 'itemUses')).map(activity => ({
        key: 'system.activities.' + activity._id + '.consumption.targets',
        type: 'override',
        value: genericUtils.duplicate(activity.consumption.targets).map(target => target.type === 'itemUses' ? {...target, target: 'feat:' + primary} : target),
        phase: 'initial',
        priority: 20
    }));
    return [...changes, {key: 'system.uses.max', type: 'override', value: '', phase: 'initial', priority: 20}, {key: 'system.uses.recovery', type: 'override', value: [], phase: 'initial', priority: 20}];
}
function maxChanges(count) {
    return count ? [{key: 'system.uses.max', type: 'override', value: '{} + ' + count, phase: 'initial', priority: 20}] : [];
}
async function sync({document: item}) {
    const actor = item.actor;
    if (!actor) return;
    const owned = pools.map(pool => actorUtils.getItemByIdentifier(actor, pool)).filter(Boolean);
    const dice = actorUtils.getItemByIdentifier(actor, 'superiority-dice');
    const primary = dice ? undefined : owned[0];
    for (const maneuver of actor.items.filter(candidate => candidate.system.type?.subtype === 'maneuver')) await enchant(maneuver, primary, primary ? consumptionChanges(maneuver, primary.system.identifier) : []);
    const target = dice ?? primary;
    for (const pool of owned) if (pool !== primary) await enchant(pool, target, target ? poolChanges(pool, target.system.identifier) : []);
    if (dice) await enchant(dice, owned[0], maxChanges(owned.length));
    else if (primary) await enchant(primary, owned[1], maxChanges(owned.length - 1));
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
    },
    {
        pass: 'deleted',
        macro: sync,
        priority: 50
    }
];
export const martialAdept = {
    name: 'Martial Adept',
    version: '2.1.11',
    rules: '2014',
    item
};
export const martialAdeptPool = {
    name: 'Martial Adept: Pool',
    version: '2.1.11',
    rules: '2014',
    item: [item[0], item[3]]
};
