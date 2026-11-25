import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, genericUtils, queryUtils} from '../../../../../proxy.mjs';
function getConfig(actor, key) {
    const item = actorUtils.getItemByIdentifier(actor, 'circle-of-the-land-spells');
    return (item && automationUtils.getConfigValue(item, key)) ?? circleOfTheLandSpells.config[key].default;
}
export function getLandIdentifiers(actor) {
    return String(getConfig(actor, 'lands')).split(',').map(identifier => identifier.trim()).filter(Boolean);
}
export function getLandItem(actor) {
    const identifiers = getLandIdentifiers(actor);
    return actor.items.find(item => identifiers.includes(item.system.identifier));
}
export function getLand(actor) {
    const item = getLandItem(actor);
    if (item) return item.system.identifier.replace(/-land$/, '');
    return actorUtils.getEffects(actor).find(effect => documentUtils.getIdentifier(effect) === 'naturesWard')?.flags['chris-premades']?.land;
}
async function getLandSources(item) {
    const identifiers = getLandIdentifiers(item.actor);
    const choice = item.advancement.byType.ItemChoice?.[0];
    const uuids = choice?.configuration.pool.map(entry => entry.uuid) ?? [];
    if (!uuids.length) {
        const pack = game.packs.get('dnd5e.classes24');
        const index = await pack?.getIndex({fields: ['system.identifier']});
        uuids.push(...(index?.filter(entry => identifiers.includes(entry.system?.identifier)).map(entry => entry.uuid) ?? []));
    }
    const sources = await Promise.all(uuids.map(uuid => fromUuid(uuid)));
    return {choice, sources: sources.filter(source => identifiers.includes(source?.system.identifier))};
}
async function getSpellData(advancement, uuid, rules) {
    const itemData = await advancement.createItemData(uuid);
    if (!itemData) return;
    const spellData = await compendiumUtils.getSpell(itemData.system.identifier, {object: true, rules});
    if (!spellData) return itemData;
    return genericUtils.mergeObject(spellData, {_id: itemData._id, flags: {dnd5e: itemData.flags.dnd5e}});
}
async function grantSpells(landItem, classLevel) {
    for (const advancement of landItem.advancement.byType.ItemGrant ?? []) {
        if (advancement.level > classLevel) continue;
        const ability = advancement.value?.ability ?? advancement.configuration.spell?.ability?.first();
        const added = {};
        const items = [];
        for (const {uuid} of advancement.configuration.items) {
            const itemData = await getSpellData(advancement, uuid, landItem.system.source?.rules);
            if (!itemData) continue;
            if (itemData.type === 'spell') advancement.configuration.spell?.applySpellChanges(itemData, {ability});
            added[itemData._id] = uuid;
            items.push(itemData);
        }
        if (!items.length) continue;
        await documentUtils.createEmbeddedDocuments(landItem.actor, 'Item', items, {keepId: true});
        await advancement.update({'value.added': added});
    }
}
async function swapLand(item) {
    const actor = item.actor;
    const {choice, sources} = await getLandSources(item);
    if (!sources.length) return;
    const current = getLandItem(actor);
    const buttons = sources.map(source => [source.name, source.uuid]);
    const selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.CircleOfTheLandSpells.Choose', buttons, {displayAsRows: true, userId: queryUtils.firstOwner(actor, true)});
    const source = sources.find(entry => entry.uuid === selection);
    if (!source || source.system.identifier === current?.system.identifier) return;
    if (current) {
        const granted = actor.items.filter(entry => entry.getFlag('dnd5e', 'advancementOrigin')?.startsWith(current.id + '.'));
        await documentUtils.deleteEmbeddedDocuments(actor, 'Item', [current.id, ...granted.map(entry => entry.id)]);
    }
    const landData = choice ? await choice.createItemData(source.uuid) : source.toObject();
    if (!choice) delete landData._id;
    const [landItem] = await documentUtils.createEmbeddedDocuments(actor, 'Item', [landData], {keepId: !!choice}) ?? [];
    if (!landItem) return;
    if (choice) {
        const level = Object.keys(choice.value.added ?? {}).find(key => current && choice.value.added[key][current.id]) ?? Object.keys(choice.configuration.choices)[0];
        const updates = {['value.added.' + level + '.' + landItem.id]: source.uuid};
        if (current && choice.value.added?.[level]?.[current.id]) updates['value.added.' + level + '.' + current.id] = _del;
        await choice.update(updates);
    }
    const classIdentifier = automationUtils.getConfigValue(item, 'classIdentifier') ?? circleOfTheLandSpells.config.classIdentifier.default;
    await grantSpells(landItem, actor.classes[classIdentifier]?.system.levels ?? 0);
}
async function use({workflow}) {
    await swapLand(workflow.item);
}
async function longRest({document: item}) {
    if (automationUtils.getConfigValue(item, 'restPrompt') ?? circleOfTheLandSpells.config.restPrompt.default) await swapLand(item);
}
export const circleOfTheLandSpells = {
    name: 'Circle of the Land Spells',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ],
    config: {
        restPrompt: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.CircleOfTheLandSpells.RestPrompt.Label',
            hint: 'CHRISPREMADES.Macros.Modern.CircleOfTheLandSpells.RestPrompt.Hint',
            category: 'homebrew'
        },
        lands: {
            default: 'arid-land, polar-land, temperate-land, tropical-land',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.CircleOfTheLandSpells.Lands.Label',
            hint: 'CHRISPREMADES.Macros.Modern.CircleOfTheLandSpells.Lands.Hint',
            category: 'homebrew'
        },
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
