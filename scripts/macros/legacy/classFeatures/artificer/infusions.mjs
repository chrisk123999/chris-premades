import {actorUtils, applications, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, uiUtils, workflowUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan as artificer} from '../../../all.mjs';
import {default as cpr} from '../../../../constants.mjs';
// called events
async function collectArmors({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const armor = data.targetActor.itemTypes.equipment.filter(i => i.system.isArmor && i.system.type?.value !== 'shield' && !i.system.properties.has('mgc'));
    if (!armor.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoArmor', {type: 'warn'}); 
    return armor;
}
async function collectArmorShield({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const armor = data.targetActor.itemTypes.equipment.filter(i => i.system.isArmor && !i.system.properties.has('mgc'));
    if (!armor.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoArmor', {type: 'warn'}); 
    return armor;
}
async function collectArmorRobes({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const armor = data.targetActor.itemTypes.equipment.filter(i => 
        (i.system.isArmor || i.system.type?.value === 'clothing') &&
        i.system.type?.value !== 'shield' &&
        !i.system.properties.has('mgc')
    );
    if (!armor.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoArmor', {type: 'warn'}); 
    return armor;
}
async function collectFoci({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const foci = data.targetActor.items.filter(i =>
        i.system.properties &&
        !i.system.properties.has('mgc') && 
        ( 
            (i.system.type?.baseItem === 'quarterstaff' && i.system.properties.has('foc')) ||
            ['rod', 'trinket', 'wand'].includes(i.system.type?.value)
        )
    );
    if (!foci.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoFoci', {type: 'warn'}); 
    return foci;
}
async function collectShield({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const shield = data.targetActor.itemTypes.equipment.filter(i => i.system.type?.value === 'shield' && !i.system.properties.has('mgc'));
    if (!shield.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoShield', {type: 'warn'}); 
    return shield;
}
async function collectWeapons({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const weapon = data.targetActor.itemTypes.weapon.filter(i => !i.system.properties.has('mgc') && ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(i.system.type?.value));
    if (!weapon.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoWeapon', {type: 'warn'}); 
    return weapon;
}
async function collectAmmoWeapons({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const weapon = data.targetActor.itemTypes.weapon.filter(i => 
        !i.system.properties.has('mgc') &&
        i.system.properties.has('amm') &&
        ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(i.system.type?.value)
    );
    if (!weapon.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoWeapon', {type: 'warn'}); 
    return weapon;
}
async function collectThrownWeapons({document: activity, data}) {
    if (data.infusionIdentifier !== documentUtils.getIdentifier(activity.item)) return;
    const weapon = data.targetActor.itemTypes.weapon.filter(i => 
        !i.system.properties.has('mgc') &&
        i.system.properties.has('thr') &&
        ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(i.system.type?.value)
    );
    if (!weapon.length) genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NoWeapon', {type: 'warn'}); 
    return weapon;
}
// helpers
/** @returns {Promise<undefined|{effect: foundry.documents.ActiveEffect, enchant: foundry.documents.ActiveEffect, item: foundry.documents.Item}>} */
async function defaultGetDocuments(workflow, {effect, enchant = true, source = 'chris-premades', identifier, label} = {}) {
    const items = workflowUtils.getWorkflowProperty(workflow, artificer.keys.infusionOptionsMarker);
    if (!items?.length) return;
    let fetchedEffect, fetchedEnchant;
    if (effect) {
        fetchedEffect = workflow.item.effects.find(e => e.type === 'base')?.toObject();
        if (!fetchedEffect) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing effect!`);
    }
    if (enchant) {
        fetchedEnchant = workflow.item.effects.find(e => e.type === 'enchantment')?.toObject();
        if (!fetchedEnchant) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing enchantment!`);
    }
    const item = await dialogUtils.selectDocumentDialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Legacy.InfuseItem.ChooseItem',
        items,
        {displayTooltips: true}
    );
    if (!item) return Logging.addMacroWarning(source, identifier, `${label} infusion exited early due to a declined prompt.`);
    return {effect: fetchedEffect, enchant: fetchedEnchant, item};
}
async function getParentEffect(infusion, createdDocument) {
    return (await effectUtils.createEffects(infusion.actor, [{
        name: infusion.name,
        img: infusion.img,
        origin: infusion.uuid,
        flags: {
            cat: {identifier: artificer.keys.createdEffectIdentifier},
            dae: {stackable: 'noneName'}
        }
    }], {parentEntity: createdDocument}))?.[0];
}
/** @returns {Promise<undefined|foundry.documents.ActiveEffect>} */
async function applyEnchant(enchant, targetItem, workflow, {effect, item, favoriteItems, source = 'chris-premades', identifier, label} = {}) {
    enchant.origin = workflow.item.uuid;
    if (effect) effect.transfer = true;
    const created = await itemUtils.enchantItem(targetItem, enchant, {
        effects: effect ? [effect] : undefined,
        items: item ? [item] : undefined,
        favoriteItems
    });
    if (!created) return Logging.addMacroError(source, identifier, `${label} infusion failed to create enchantment. (self uuid) ${workflow.actor.uuid} (target item uuid) ${targetItem.uuid}`);
    const parent = await getParentEffect(workflow.item, created);
    if (!parent) return Logging.addMacroWarning(source, identifier, `${label} infusion failed to create parent effect. (self uuid) ${workflow.actor.uuid} (target item uuid) ${targetItem.uuid}`);
    await documentUtils.makeDependent(parent, [created]);
    return created;
}
// infusions
async function arcanePropulsion({macroClass: {source, identifier}, workflow}) {
    const label = 'Arcane Propulsion';
    const data = await defaultGetDocuments(workflow, {effect: true, source, identifier, label});
    if (!data) return;
    const gauntlet = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'arcane-propulsion-gauntlet', {
        translate: 'CHRISPREMADES.Macros.Legacy.InfuseItem.ArcanePropulsionGauntlet',
        object: true
    });
    if (!gauntlet) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing gauntlet pack item! (pack) ${cpr.packs.misc.automationItems} (identifier) arcane-propulsion-gauntlet`);
    await applyEnchant(data.enchant, data.item, workflow, {effect: data.effect, item: gauntlet, favoriteItems: true, source, identifier, label});
}
async function magicalStrength({macroClass: {source, identifier}, workflow}) {
    const label = 'Armor of Magical Strength';
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (!data) return;
    const activityHolder = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'armor-of-magical-strength-activities');
    if (!activityHolder) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.misc.automationItems} (identifier) armor-of-magical-strength-activities`);
    const checkSave = itemUtils.getActivityByIdentifier(activityHolder, 'check-save-bonus')?.toObject();
    if (!checkSave) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing activity! (item) ${activityHolder.uuid} (identifier) check-save-bonus`);
    const avoidProne = itemUtils.getActivityByIdentifier(activityHolder, 'avoid-prone')?.toObject();
    if (!avoidProne) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing activity! (item) ${activityHolder.uuid} (identifier) avoid-prone`);
    const enchant = await applyEnchant(data.enchant, data.item, workflow, {effect: data.effect, source, identifier, label});
    if (!enchant) return;
    genericUtils.setProperty(checkSave, 'flags.dnd5e.dependentOn', enchant.uuid);
    genericUtils.setProperty(avoidProne, 'flags.dnd5e.dependentOn', enchant.uuid);
    await documentUtils.update(data.item, {'system.activities': {
        [checkSave._id]: checkSave,
        [avoidProne._id]: avoidProne
    }});
    const createdAvoidProne = data.item.system.activities.get(avoidProne._id);
    if (createdAvoidProne) await actorUtils.addFavorites(data.item.actor, [createdAvoidProne]);
}
async function magicalStrengthProne({workflow}) {
    const prone = actorUtils.getStatusSources(workflow.actor, ['prone']);
    if (prone?.length) await documentUtils.deleteDocument(prone[0]);
    else genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NotProne');
}
async function bootsWinding({macroClass: {source, identifier}, workflow}) {
    const label = 'Boots of the Winding Path';
    const boots = await compendiumUtils.getDocumentByIdentifier(cpr.packs.legacy.equipment, 'boots-of-the-winding-path', {
        translate: 'CHRISPREMADES.Macros.Legacy.InfuseItem.BootsOfTheWindingPath',
        object: true
    });
    if (!boots) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.legacy.equipment} (identifier) boots-of-the-winding-path`);
    genericUtils.setProperty(boots, `flags.${source}.${artificer.keys.createdItemFlag}`, workflow.item.uuid);
    const target = workflow.targets.first()?.actor ?? workflow.actor;
    const item = (await itemUtils.createItems(target, [boots], {favorite: true}))?.[0];
    if (!item) return Logging.addMacroWarning(source, identifier, `${label} infusion failed to create item. (self uuid) ${workflow.actor.uuid} (target uuid) ${target.uuid}`);
    const parent = await getParentEffect(workflow.item, item);
    if (parent) await documentUtils.makeDependent(parent, [item]);
}
async function enhancedFocus({macroClass: {source, identifier}, workflow}) {
    const label = 'Enhanced Arcane Focus';
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(bonusConfig));
    config.level = workflow.actor.classes[config.classIdentifer]?.system.levels ?? 0;
    const data = await defaultGetDocuments(workflow, {effect: true, source, identifier, label});
    if (!data) return;
    if (config.level >= config.grantExtraBonus) for (const change of data.effect.system.changes) {
        if (!['system.bonuses.msak.attack', 'system.bonuses.rsak.attack', 'system.bonuses.spell.attack'].includes(change.key)) continue;
        change.value = 2;
    }
    await applyEnchant(data.enchant, data.item, workflow, {effect: data.effect, source, identifier, label});
}
async function resistantArmor({macroClass: {source, identifier}, workflow}) {
    const label = 'Resistant Armor';
    const items = workflowUtils.getWorkflowProperty(workflow, artificer.keys.infusionOptionsMarker);
    if (!items?.length) return;
    const effect = workflow.item.effects.find(e => e.type === 'base')?.toObject();
    const enchant = workflow.item.effects.find(e => e.type === 'enchantment')?.toObject();
    if (!effect || !enchant) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to missing effects!`);
    const damages = automationUtils.getConfigValue(workflow.item, 'damage');
    const itemEntries = [];
    for (const i of items) itemEntries.push({
        label: i.name,
        name: i.id,
        options: {
            image: i.img,
            tooltip: await uiUtils.enrichHTML(i.system.description.value, i.getRollData())
        }
    });
    const dmg = CONFIG.DND5E.damageTypes;
    const choices = await applications.DialogApp.dialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Legacy.InfuseItem.ChooseItem',
        [
            ['combobox', [{
                label: 'CHRISPREMADES.Macros.Legacy.InfuseItem.Resistance',
                name: 'resistance',
                options: {
                    value: damages[0],
                    options: damages.map(d => ({
                        value: d,
                        image: constants.damageIcons[d] ?? dmg[d].icon,
                        label: dmg[d].label
                    }))
                }
            }]],
            ['button', itemEntries, {displayAsRows: true}]
        ],
        'cancel'
    );
    if (!choices?.buttons) return Logging.addMacroWarning(source, identifier, `${label} infusion exited early due to a declined prompt.`);
    const item = items.find(i => i.id == choices.buttons);
    const resistanceChange = effect.system.changes.find(c => c.key === 'system.traits.dr.value');
    if (resistanceChange) resistanceChange.value = choices.resistance;
    await applyEnchant(enchant, item, workflow, {effect, source, identifier, label});
}
const metadata = {
    version: '2.0.4',
    rules: '2014'
};
const bonusConfig = {
    classIdentifer: {
        default: 'artificer',
        type: 'text',
        label: 'CHRISPREMADES.Config.ClassIdentifier',
        category: 'behavior'
    },
    grantExtraBonus: {
        default: 10,
        type: 'select',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Legacy.InfuseItem.ExtraBonus',
        get options() { return constants.characterLevelOptions; }
    }
};

const calledMacro = fn => ({...metadata, called: [{pass: 'actorInfusionItems', macro: fn, priority: 200}]});
export const infusionCollectArmors = calledMacro(collectArmors);
export const infusionCollectArmorShield = calledMacro(collectArmorShield);
export const infusionCollecArmorRobes = calledMacro(collectArmorRobes);
export const infusionCollectFoci = calledMacro(collectFoci);
export const infusionCollectShield = calledMacro(collectShield);
export const infusionCollectWeapons = calledMacro(collectWeapons);
export const infusionCollectAmmoWeapons = calledMacro(collectAmmoWeapons);
export const infusionCollectThrownWeapons = calledMacro(collectThrownWeapons);

const rollMacro = fn => ({...metadata, roll: [{pass: 'activityRollFinished', macro: fn, priority: 50}]});
export const infusionArcanePropulsion = rollMacro(arcanePropulsion);
export const infusionArmorOfMagicalStrength = rollMacro(magicalStrength);
export const infusionArmorOfMagicalStrengthProne = rollMacro(magicalStrengthProne);
export const infusionBootsOfTheWindingPath = rollMacro(bootsWinding);
export const infusionEnhancedArcaneFocus = {...rollMacro(enhancedFocus), config: bonusConfig};
export const infusionResistantArmor = {
    ...rollMacro(resistantArmor),
    config: {
        damage: {
            default: ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
