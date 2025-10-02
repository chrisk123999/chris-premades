import {actorUtils, effectUtils, genericUtils, socketUtils, compendiumUtils, animationUtils, activityUtils} from '../../utils.js';
import {gambitPremades} from '../../integrations/gambitsPremades.js';
import {miscPremades} from '../../integrations/miscPremades.js';
import {custom} from '../../events/custom.js';
import {ItemMedkit} from '../../applications/medkit-item.js';
import {requirements} from '../../extensions/requirements.js';
function getSaveDC(item) {
    if (item.hasSave) return item.system.activities.getByType('save')[0].save.dc.value;
    return item.actor?.system?.abilities?.[item.abilityMod]?.dc ?? 10;
}
async function createItems(actor, updates, {favorite, section, parentEntity, identifier, castData} = {}) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (section) updates.forEach(i => genericUtils.setProperty(i, 'flags.tidy5e-sheet.section', section));
    if (identifier) updates.forEach(i => genericUtils.setProperty(i, 'flags.chris-premades.info.identifier', identifier));
    if (castData) updates.forEach(i => genericUtils.setProperty(i, 'flags.chris-premades.castData', castData));
    let items;
    if (hasPermission) {
        items = await actor.createEmbeddedDocuments('Item', updates);
    } else {
        items = await genericUtils.createEmbeddedDocuments(actor, 'Item', updates);
    }
    if (favorite) await actorUtils.addFavorites(actor, items);
    if (parentEntity) await effectUtils.addDependent(parentEntity, items);
    return items;
}
function getItemDescription(name) {
    let journal = game.journal.getName('CPR - Descriptions');
    if (!journal) {
        genericUtils.notify('CHRISPREMADES.Error.MissingDescriptionJournal', 'warn');
        return '';
    }
    let page = journal.pages.getName(name);
    if (!page) {
        genericUtils.notify('CHRISPREMADES.Error.MissingDescriptionPage', 'warn');
        return '';
    }
    return page.text.content;
}
function isSpellFeature(item) {
    return item.system.type?.value === 'spellFeature';
}
function getConfig(item, key) {
    if (key === 'playAnimation' && (!genericUtils.getCPRSetting('enableAnimations') || !animationUtils.sequencerCheck())) return false;
    if (key === 'animation'     && (!genericUtils.getCPRSetting('enableAnimations') || !animationUtils.sequencerCheck())) return 'none';
    let flagValue = item.flags['chris-premades']?.config?.[key];
    if (flagValue !== undefined) return flagValue;
    let identifier = genericUtils.getIdentifier(item);
    if (!identifier) return;
    let value = custom.getMacro(identifier, genericUtils.getRules(item))?.config?.find(i => i.value === key)?.default;
    return value === '' ? false : value;
}
async function setConfig(item, key, value) {
    return await genericUtils.setFlag(item, 'chris-premades', 'config.' + key, value);
}
function getItemByIdentifier(actor, identifier) {
    return actor.items.find(i => genericUtils.getIdentifier(i) === identifier);
}
function getAllItemsByIdentifier(actor, identifier) {
    return actor.items.filter(i => genericUtils.getIdentifier(i) === identifier);
}
function getVersion(item) {
    return item?.flags['chris-premades']?.info?.version ?? item?._stats?.modifiedTime;
}
function getSource(item) {
    return item?.flags['chris-premades']?.info?.source;
}
// -1: None applied
// 0: Out of Date
// 1: Up to Date
// 2: Generic
async function isUpToDate(item) {
    let version = getVersion(item);
    let source = getSource(item);
    if (!version || !source) return (item.flags['chris-premades']?.config?.generic ? 2 : -1);
    let sourceVersion;
    let type = item.actor?.type ?? 'character';
    if (type != 'character' && type != 'npc') return;
    let monster;
    if (type === 'npc') monster = item.actor.prototypeToken.name;
    switch (source) {
        case 'gambits-premades':
            if (type === 'character' || item.type === 'spell') {
                sourceVersion = gambitPremades.gambitItems.find(i => i.name === item.name)?.version;
            } else {
                sourceVersion = gambitPremades.gambitMonsters.find(i => i.name === item.name && i.monster === monster)?.version;
            }
            break;
        case 'midi-item-showcase-community':
            if (type === 'character' || item.type === 'spell') {
                sourceVersion = miscPremades.miscItems.find(i => i.name === item.name)?.version;
            } else {
                sourceVersion = miscPremades.miscMonsters.find(i => i.name === item.name && i.monster === monster)?.version;
            }
            break;
        case 'automated-crafted-creations':
        case 'chris-premades': {
            let identifier = genericUtils.getIdentifier(item);
            let rules = genericUtils.getRules(item);
            let macro = custom.getMacro(identifier, rules);
            sourceVersion = macro?.version;
            let savedRules = item.flags['chris-premades']?.info?.rules ?? 'legacy';
            if (savedRules && (rules != savedRules)) return 0;
            break;
        }
        default: {
            let sourceObj = await compendiumUtils.getItemFromCompendium(source, item.name, {ignoreNotFound: true, object: true});
            sourceVersion = getVersion(sourceObj);
            break;
        }
    }
    if (!sourceVersion) return -1;
    let compare = genericUtils.isNewerVersion(sourceVersion, version);
    return compare ? 0 : 1;
}
async function syntheticItem(itemData, actor) {
    let item = new CONFIG.Item.documentClass(itemData, {parent: actor});
    item.prepareData();
    item.prepareFinalAttributes();
    item.applyActiveEffects();
    return item;
}
async function enchantItem(item, effectData, {effects = [], items = [], concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent} = {}) {
    genericUtils.setProperty(effectData, 'type', 'enchantment');
    effectData.transfer = false;
    genericUtils.setProperty(effectData, 'flags.dnd5e.enchantment', {
        level: {
            min: null,
            max: null
        },
        riders: {
            effect: effects,
            item: items
        }
    });
    return await effectUtils.createEffect(item, effectData, {concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent});
}
function convertDuration(entity) {
    if (entity.documentName === 'Item') {
        return DAE.convertDuration(entity.system.duration);
    } else if (entity.documentName === 'Activity') {
        return DAE.convertDuration(entity.duration);
    }
}
function getEquipmentState(item) {
    let currentlyEquipped = item.system.equipped;
    let currentlyAttuned = item.system.attuned;
    let attunement = item.system?.attunement;
    let validTypes = ['required', 'optional'];
    let requiresAttunement = validTypes.includes(attunement);
    return ((requiresAttunement && currentlyAttuned) || !requiresAttunement) && currentlyEquipped ? true : false;
}
function getToolProficiency(actor, tool) {
    let toolName = tool.system.type?.baseItem;
    if (!toolName) return 0;
    return actor.system.tools[toolName]?.value ?? 0;
}
function getSavedCastData(item) {
    return item.flags['chris-premades']?.castData;
}
function getGenericFeatureConfig(item, key) {
    return item.flags['chris-premades']?.config?.generic?.[key];
}
function getItemByGenericFeature(actor, key) {
    return actor.items.find(i => getGenericFeatureConfig(i, key));
}
function isWeaponProficient(item) {
    if (item.system.proficient) return true;
    if (!item.actor) return false;
    if (item.actor.type === 'npc') return true;
    if (item.actor.system.traits.weaponProf.value.has(item.system.type.baseItem)) return true;
    if (item.actor.system.traits.weaponProf.value.has(CONFIG.DND5E.weaponProficienciesMap[item.system.type.value])) return true;
    return false;
}
async function itemUpdate(item) {
    return await ItemMedkit.itemUpdate(item);
}
async function setHiddenActivities(item, activityIdentifiers, replace = true) {
    let existingHidden = replace ? [] : item.flags?.['chris-premades']?.hiddenActivities ?? [];
    existingHidden = new Set(existingHidden.concat(activityIdentifiers));
    await genericUtils.setFlag(item, 'chris-premades', 'hiddenActivities', Array.from(existingHidden));
    await genericUtils.update(item);
}
async function setSpellActivities(item, activityIdentifiers, replace = true) {
    let existingSpells = replace ? [] : item.flags?.['chris-premades']?.spellActivities ?? [];
    existingSpells = new Set(existingSpells.concat(activityIdentifiers));
    await genericUtils.setFlag(item, 'chris-premades', 'spellActivities', Array.from(existingSpells));
    await genericUtils.update(item);
}
function getHiddenActivities(item) {
    return genericUtils.getProperty(item, 'flags.chris-premades.hiddenActivities');
}
function getSpellActivities(item) {
    return genericUtils.getProperty(item, 'flags.chris-premades.spellActivities');
}
function getActivity(item, type) {
    return item.system.activities.getByType(type)?.[0];
}
function getEffectByIdentifier(item, identifier) {
    return item.effects.find(i => genericUtils.getIdentifier(i) === identifier);
}
function cloneItem(item, updates = {}, options = {keepId: true}) {
    let clone = item.clone(updates, options);
    clone.prepareData();
    clone.applyActiveEffects();
    return clone;
}
async function correctActivityItemConsumption(item, activityIdentifiers = [], targetIdentifier) {
    let target = itemUtils.getItemByIdentifier(item.actor, targetIdentifier);
    if (!target) return;
    let itemData = genericUtils.duplicate(item.toObject());
    let updates = {};
    activityIdentifiers.forEach(identifier => {
        let activity = activityUtils.getActivityByIdentifier(item, identifier, {strict: true});
        if (!activity) return;
        itemData.system.activities[activity.id].consumption.targets[0].target = target.id;
        let path = 'system.activities.' + activity.id + '.consumption.targets';
        updates[path] = itemData.system.activities[activity.id].consumption.targets;
    });
    if (Object.keys(updates).length) return await genericUtils.update(item, updates);
}
async function multiCorrectActivityItemConsumption(item, activityIdentifiers = [], corrections = {}) {
    /*{
        0: 'firstItemIdentifier',
        1: 'secondItemIdentifier
    }*/
    let itemData = genericUtils.duplicate(item.toObject());
    let updates = {};
    activityIdentifiers.forEach(identifier => {
        let activity = activityUtils.getActivityByIdentifier(item, identifier, {strict: true});
        if (!activity) return;
        for (let i of Object.keys(corrections)) {
            let targetItem = itemUtils.getItemByIdentifier(item.actor, corrections[i]);
            if (!targetItem) continue;
            itemData.system.activities[activity.id].consumption.targets[i].target = targetItem.id;
        }
        let path = 'system.activities.' + activity.id + '.consumption.targets';
        updates[path] = itemData.system.activities[activity.id].consumption.targets;
    });
    if (Object.keys(updates).length) return await genericUtils.update(item, updates);
}
async function fixScales(item) {
    return await requirements.scaleCheck(item);
}
function canUse(item) {
    if (!item.system.activities.size) return true;
    return item.system.activities.find(i => activityUtils.canUse(i));
}
export let itemUtils = {
    getSaveDC,
    createItems,
    getItemDescription,
    isSpellFeature,
    getConfig,
    getItemByIdentifier,
    getAllItemsByIdentifier,
    getVersion,
    getSource,
    isUpToDate,
    syntheticItem,
    enchantItem,
    convertDuration,
    setConfig,
    getEquipmentState,
    getToolProficiency,
    getSavedCastData,
    getGenericFeatureConfig,
    getItemByGenericFeature,
    isWeaponProficient,
    itemUpdate,
    setHiddenActivities,
    getHiddenActivities,
    getActivity,
    getEffectByIdentifier,
    getSpellActivities,
    setSpellActivities,
    cloneItem,
    correctActivityItemConsumption,
    fixScales,
    multiCorrectActivityItemConsumption,
    canUse
};