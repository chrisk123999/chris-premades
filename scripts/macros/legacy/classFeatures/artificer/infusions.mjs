import {actorUtils, applications, automationUtils, compendiumUtils, constants, dataUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, summonUtils, tokenUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
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
async function defaultGetDocuments(workflow, {effect, enchant = true, source, identifier, label} = {}) {
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
async function applyEnchant(enchant, targetItem, workflow, {effect, item, favoriteItems, source, identifier, label} = {}) {
    dataUtils.setOrigin(enchant, workflow.item);
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
async function copyActivities(workflow, identifier, activityIdentifiers, {pack, favoriteActivities, source, macro, label} = {}) {
    const data = await defaultGetDocuments(workflow, {source, identifier: macro, label});
    if (!data) return;
    const item = await compendiumUtils.getDocumentByIdentifier(pack, identifier);
    if (!item) return Logging.addMacroWarning(source, macro, `${label} infusion failed due to a missing pack item! (pack) ${pack} (identifier) ${identifier}`);
    const activityData = [];
    for (const id of activityIdentifiers) {
        const activity = itemUtils.getActivityByIdentifier(item, id);
        if (!activity) return Logging.addMacroWarning(source, macro, `${label} infusion failed due to a missing activity! (item) ${item.uuid} (identifier) ${id}`);
        activityData.push(activity.toObject());
    }
    const enchant = await applyEnchant(data.enchant, data.item, workflow, {source, identifier: macro, label});
    if (!enchant) return;
    let favorites = [];
    await documentUtils.update(data.item, activityData.reduce((obj, a) => {
        if (favoriteActivities?.includes(a.identifier)) favorites.push(a._id);
        genericUtils.setProperty(a, 'flags.dnd5e.dependentOn', enchant.uuid);
        obj.system.activities[a._id] = a;
        return obj;
    }, {system: {activities: {}}}));
    if (favorites.length) favorites = favorites.map(id => data.item.system.activities.get(id)).filter(Boolean);
    if (favorites.length) await actorUtils.addFavorites(data.item.actor, favorites);
}
async function simpleCreateItem(workflow, identifier, translate, {favorite, source, macro, label} = {}) {
    const itemData = await compendiumUtils.getDocumentByIdentifier(cpr.packs.legacy.equipment, identifier, {translate, object: true});
    if (!itemData) return Logging.addMacroWarning(source, macro, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.legacy.equipment} (identifier) ${identifier}`);
    genericUtils.setProperty(itemData, `flags.${source}.${artificer.keys.createdItemFlag}`, workflow.item.uuid);
    const target = workflow.targets.first()?.actor ?? workflow.actor;
    const item = (await itemUtils.createItems(target, [itemData], {favorite}))?.[0];
    if (!item) return Logging.addMacroWarning(source, macro, `${label} infusion failed to create item. (self uuid) ${workflow.actor.uuid} (target uuid) ${target.uuid}`);
    const parent = await getParentEffect(workflow.item, item);
    if (parent) await documentUtils.makeDependent(parent, [item]);
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
    await copyActivities(
        workflow,
        'armor-of-magical-strength-activities',
        ['check-save-bonus', 'avoid-prone'],
        {
            pack: cpr.packs.misc.automationItems,
            favoriteActivities: ['avoid-prone'],
            label: 'Armor of Magical Strength',
            macro: identifier,
            source
        }
    );
}
async function magicalStrengthProne({workflow}) {
    const prone = actorUtils.getStatusSources(workflow.actor, ['prone']);
    if (prone?.length) await documentUtils.deleteDocument(prone[0]);
    else genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.NotProne');
}
async function bootsWinding({macroClass: {source, identifier}, workflow}) {
    await simpleCreateItem(
        workflow,
        'boots-of-the-winding-path',
        'CHRISPREMADES.Macros.Legacy.InfuseItem.BootsOfTheWindingPath',
        {favorite: true, source, macro: identifier, label: 'Boots of the Winding Path'}
    );
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
async function enhancedDefense({macroClass: {source, identifier}, workflow}) {
    const label = 'Enhanced Defense';
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(bonusConfig));
    config.level = workflow.actor.classes[config.classIdentifer]?.system.levels ?? 0;
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (!data) return;
    if (config.level >= config.grantExtraBonus) for (const change of data.enchant.system.changes) {
        if (change.key === 'system.armor.magicalBonus') change.value = 2;
    }
    await applyEnchant(data.enchant, data.item, workflow, {source, identifier, label});
}
async function enhancedWeapon({macroClass: {source, identifier}, workflow}) {
    const label = 'Enhanced Weapon';
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(bonusConfig));
    config.level = workflow.actor.classes[config.classIdentifer]?.system.levels ?? 0;
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (!data) return;
    if (config.level >= config.grantExtraBonus) for (const change of data.enchant.system.changes) {
        if (change.key === 'system.magicalBonus') change.value = 2;
    }
    await applyEnchant(data.enchant, data.item, workflow, {source, identifier, label});
}
async function helmOfAwareness({macroClass: {source, identifier}, workflow}) {
    await simpleCreateItem(
        workflow,
        'helm-of-awareness',
        'CHRISPREMADES.Macros.Legacy.InfuseItem.HelmAwareness',
        {source, macro: identifier, label: 'Helm of Awareness'}
    );
}
async function homunculus({macroClass: {source, identifier}, workflow}) {
    const label = 'Homonculus Servant';
    const actor = await compendiumUtils.getDocumentByIdentifier(cpr.packs.legacy.summons, 'homunculusServant');
    if (!actor) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.legacy.summons} (identifier) homunculusServant`);
    const flatAttack = workflow.actor.system.attributes.spell.attack;
    const fetch = [
        {id: 'channel-magic', options: {object: true, translate: 'CHRISPREMADES.Macros.Legacy.InfuseItem.ChannelMagic'}},
        {id: 'evasion', options: {object: true}},
        {id: 'force-strike', options: {object: true, flatAttack, translate: 'CHRISPREMADES.Macros.Legacy.InfuseItem.ForceStrike'}},
        {id: 'mending-homonculus-servant', options: {object: true}}
    ];
    const items = await Promise.all(fetch.map(async i => {
        const item = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, i.id, i.options);
        if (!item) Logging.addMacroWarning(`${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.misc.automationItems} (identifier) ${i.id}`);
        return item;
    }));
    if (items.some(f => !f)) return;
    const heart = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'heart-of-homunculus-servant', {translate: 'CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusHeart', object: true});
    if (!heart) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.misc.automationItems} (identifier) heart-of-homunculus-servant`);
    genericUtils.setProperty(heart, `flags.${source}.${artificer.keys.createdItemFlag}`, workflow.item.uuid);
    const target = workflow.targets.first().document ?? workflow.token.document;
    const sourceDocument = (await itemUtils.createItems(target.actor, [heart], {favorite: true}))?.[0];
    if (!sourceDocument) return Logging.addMacroWarning(source, identifier, `${label} infusion failed to create item. (self uuid) ${workflow.actor.uuid} (target uuid) ${target.actor.uuid}`);
    const parent = await getParentEffect(workflow.item, sourceDocument);
    if (!parent) return;
    await documentUtils.makeDependent(parent, [sourceDocument]);
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(infusionHomunculusServant.config));    
    const level = workflow.actor.classes[config.classIdentifer]?.system.levels || 1;
    const hp = (await rollUtils.rollDice(config.hp, {document: workflow.activity}))?.total || 1;
    const updates = { system: {
        details: {cr: actorUtils.getCR(workflow.actor)},
        attributes: {hp: {formula: `${level}d4`, max: hp, value: hp}}
    }};
    for (const existing of summonUtils.getSummonsBySource(workflow.item)) await summonUtils.deleteSummon(existing);
    const summon = await summonUtils.createSummon(target.actor, actor, {
        items,
        parent,
        updates,
        ...config,
        sourceDocument,
        dismissAtZero: true,
        initiative: 'follows',
        name: config.name || _loc('CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusServant')
    });
    if (!summon) return Logging.addMacroWarning(`${label} infusion failed to create summon!`);
    await documentUtils.makeDependent(parent, [summon.actor]);
    await summonUtils.placeSummon(summon, 5, {token: target});
}
async function homunculusChannel({document: activity, macroClass: {source}}) {
    const summon = summonUtils.getSummonsByIdentifier('homunculusServant', {actor: activity.actor})[0];
    if (!summon?.token) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusNotActive');
    if (actorUtils.hasUsedReaction(summon.actor))
        return genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.ReactionUsed');
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.name,
        img: activity.img,
        origin: activity.uuid,
        specialDuration: ['1Spell'],
        identifier: 'homunculusChannel',
        duration: {value: 1, units: 'seconds'},
        macros: [
            {
                type: 'roll',
                macros: [
                    {
                        source: 'chris-premades',
                        rules: '2014',
                        identifier: 'infusionHomunculusServantChannelEarly'
                    }
                ]
            }
        ],
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                type: 'custom',
                value: 1,
                priority: 20
            }
        ]
    });
    genericUtils.setProperty(effectData, 'flags.dae.expiryMode', 'delete');
    genericUtils.setProperty(effectData, 'flags.dae.stackable', 'noneName');
    genericUtils.setProperty(effectData, `flags.${source}.infusion`, activity.item.flags[source]?.[artificer.keys.createdItemFlag]);
    const [casterEffect] = await effectUtils.createEffects(activity.actor, [effectData]);
    await effectUtils.createEffects(summon.actor, [effectData], {parentEntity: casterEffect});
}
async function homunculusChannelEarly({document: effect, macroClass: {source}, workflow, token}) {
    const notify = msg => { 
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.' + msg); 
        return workflow.aborted = true;
    };
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') return notify('InvalidSpell');
    const familiarToken = summonUtils.getSummonsByIdentifier('homunculusServant', {actor: workflow.actor})[0]?.token;
    if (!familiarToken) return notify('TooFar');
    const infusion = await fromUuid(effect.flags[source]?.infusion);
    const range = infusion ? automationUtils.getConfigValue(infusion, 'touchRange') : 120;
    if (tokenUtils.getDistance(token, familiarToken) > range) return notify('TooFar');
    if (actorUtils.hasUsedReaction(familiarToken.actor)) return notify('ReactionUsed');
    await actorUtils.setReactionUsed(familiarToken.actor);
}
async function homunculusCommand({document: activity}) {
    const summon = summonUtils.getSummonsByIdentifier('homunculusServant', {actor: activity.actor})[0];
    if (!summon?.token) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusNotActive');
    const actorSheet = activity.actor.sheet;
    const summonSheet = summon.actor.sheet;
    if (actorSheet.rendered && !actorSheet.minimized) await actorSheet.minimize();
    if (!summonSheet.rendered) await summonSheet.render({force: true});
    else if (summonSheet.minimized) await summonSheet.maximize();
    uiUtils.bringToFront(summonSheet);
}
async function homunculusDeath({document: heart}) {
    await documentUtils.deleteDocument(heart);
}
async function mindSharpener({macroClass: {source, identifier}, workflow}) {
    await copyActivities(
        workflow,
        'mind-sharpener',
        ['mind-sharpener-succeed'],
        {
            pack: cpr.packs.legacy.equipment,
            label: 'Mind Sharpener',
            macro: identifier,
            source
        }
    );
}
async function radiantWeapon({macroClass: {source, identifier}, workflow}) {
    const label = 'Radiant Weapon';
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (!data) return;
    const item = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'radiant-weapon-activities');
    if (!item) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing pack item! (pack) ${cpr.packs.misc.automationItems} (identifier) radiant-weapon-activities`);
    const activityData = [];
    for (const id of ['radiant-weapon-light', 'radiant-weapon-blind']) {
        const activity = itemUtils.getActivityByIdentifier(item, id);
        if (!activity) return Logging.addMacroWarning(source, identifier, `${label} infusion failed due to a missing activity! (item) ${item.uuid} (identifier) ${id}`);
        activityData.push(activity.toObject());
    }
    dataUtils.setOrigin(data.enchant, workflow.item);
    const effects = item.effects.map(e => dataUtils.setOrigin(e.toObject(), data.item));
    const enchant = await itemUtils.enchantItem(data.item, data.enchant, {effects});
    if (!enchant) return Logging.addMacroError(source, identifier, `${label} infusion failed to create enchantment. (self uuid) ${workflow.actor.uuid} (target item uuid) ${data.item.uuid}`);
    const light = documentUtils.getEffectByIdentifier(data.item, 'radiantWeaponLight');
    const blind = documentUtils.getEffectByIdentifier(data.item, 'radiantWeaponBlind');
    const parent = await getParentEffect(workflow.item, enchant);
    if (!parent) return Logging.addMacroWarning(source, identifier, `${label} infusion failed to create parent effect. (self uuid) ${workflow.actor.uuid} (target item uuid) ${data.item.uuid}`);
    await documentUtils.makeDependent(parent, [enchant]);
    await documentUtils.update(data.item, activityData.reduce((obj, a, i) => {
        const effect = a.midiProperties.identifier === 'radiant-weapon-light' ? light : blind;
        genericUtils.setProperty(a, 'flags.dnd5e.dependentOn', enchant.uuid);
        obj.system.activities[a._id] = a;
        a.effects = [{_id: effect._id}];
        return obj;
    }, {system: {activities: {}}}));
}
async function repeatingShot({macroClass: {source, identifier}, workflow}) {
    const label = 'Repeating Shot';
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (data) await applyEnchant(data.enchant, data.item, workflow, {source, identifier, label});
}
async function repulsionShield({macroClass: {source, identifier}, workflow}) {
    await copyActivities(
        workflow,
        'repulsion-shield',
        ['repulsion-shield-push'],
        {
            pack: cpr.packs.legacy.equipment,
            label: 'Repulsion Shield',
            macro: identifier,
            source
        }
    );
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
async function returningWeapon({macroClass: {source, identifier}, workflow}) {
    const label = 'Returning Weapon';
    const data = await defaultGetDocuments(workflow, {source, identifier, label});
    if (data) await applyEnchant(data.enchant, data.item, workflow, {source, identifier, label});
}
async function spellRing({macroClass: {source, identifier}, workflow}) {
    await simpleCreateItem(
        workflow,
        'spell-refueling-ring',
        'CHRISPREMADES.Macros.Legacy.InfuseItem.SpellRing',
        {favorite: true, source, macro: identifier, label: 'Spell-Refueling Ring'}
    );
}
const metadata = {
    version: '2.1.3',
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
export const infusionEnhancedDefense = {...rollMacro(enhancedDefense), config: bonusConfig};
export const infusionEnhancedWeapon = {...rollMacro(enhancedWeapon), config: bonusConfig};
export const infusionHelmOfAwareness = rollMacro(helmOfAwareness);
export const infusionHomunculusServant = {
    ...rollMacro(homunculus),
    config: {
        classIdentifer: {
            default: 'artificer',
            type: 'text',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.ClassIdentifier'
        },
        touchRange: {
            default: 120,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.TouchRange'
        },
        hp: {
            default: '1 + @abilities.int.mod + @classes.artificer.levels',
            type: 'text',
            category: 'summons',
            label: 'CHRISPREMADES.Config.HitPoints'
        },
        name: {
            default: '',
            type: 'text',
            category: 'summons',
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusServant'
        },
        tokenImg: {
            default: '',
            type: 'file',
            category: 'summons',
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusServant'
        },
        avatarImg: {
            default: '',
            type: 'file',
            category: 'summons',
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusServant'
        },
        animation: {
            default: {source: 'chris-premades', identifier: 'futureSummon'}, 
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            i18nOption: 'CHRISPREMADES.Macros.Legacy.InfuseItem.HomunculusServant'
        }
    }
};
export const infusionHomunculusServantChannel = rollMacro(homunculusChannel);
export const infusionHomunculusServantChannelEarly = {
    ...metadata,
    roll: [
        {
            pass: 'actorPreItemRoll',
            macro: homunculusChannelEarly,
            priority: 50
        }
    ]
};
export const infusionHomunculusServantCommand = rollMacro(homunculusCommand);
export const infusionHomunculusServantDeath = {
    ...metadata,
    summon: [
        {
            pass: 'delete',
            macro: homunculusDeath,
            priority: 100
        }
    ]
};
export const infusionMindSharpener = rollMacro(mindSharpener);
export const infusionRadiantWeapon = rollMacro(radiantWeapon);
export const infusionRepeatingShot = rollMacro(repeatingShot);
export const infusionRepulsionShield = rollMacro(repulsionShield);
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
export const infusionReturningWeapon = rollMacro(returningWeapon);
export const infusionSpellRefuelingRing = rollMacro(spellRing);
