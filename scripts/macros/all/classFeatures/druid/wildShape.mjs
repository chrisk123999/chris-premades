import {default as cpr} from '../../../../constants.mjs';
import {actorUtils, applications, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
function getClassItem(item) {
    const classIdentifier = automationUtils.getConfigValue(item, 'classIdentifier') ?? wildShape.config.classIdentifier.default;
    return item.actor.classes[classIdentifier] ?? itemUtils.getAdvancementSourceItem(item);
}
async function getConfigs(item) {
    const identifier = documentUtils.getIdentifier(item);
    const config = Object.fromEntries(Object.entries(wildShape.config).map(([key, {default: value}]) => [key, automationUtils.getConfigValue(item, key) ?? value]));
    const classItem = getClassItem(item);
    const forms = (await rollUtils.rollDice(config.forms, {document: item})).total;
    const cr = (await rollUtils.rollDice(config.cr, {document: item})).total;
    const packs = config.packs.map(p => p.split(':')[1]).filter(Boolean);
    const level = classItem?.system.levels ?? 0;
    const canFly = level >= (config.grantFlySpeed || 99);
    const canSwim = level >= (config.grantSwimSpeed ?? 0);
    if (!forms) return Logging.addMacroWarning('CPR', identifier, 'Could not evaluate wild shape count scale value: ' + config.forms, {notify: 'warn'});
    if (cr === undefined) return Logging.addMacroWarning('CPR', identifier, 'Could not evaluate wild shape CR scale value: ' + config.cr, {notify: 'warn'});
    return {...config, canFly, canSwim, cr, forms, packs};
}
async function learnForm({identifier, workflow}) {
    const config = await getConfigs(workflow.item);
    if (!config) return;
    const wildShapeActivity = itemUtils.getActivityByIdentifier(workflow.item, 'change-form');
    if (!wildShapeActivity) return Logging.addMacroWarning('CPR', identifier, 'Missing wild shape activity: change-form', {notify: 'warn'});
    const forms = (await Promise.all(wildShapeActivity.profiles.map(p => fromUuid(p.uuid)))).filter(Boolean);
    if (forms.length > config.forms) return Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.All.WildShape.MaxKnown', {notify: 'warn', format: {count: forms.length, max: config.forms}});
    let selected;
    if (forms.length) {
        const addNoneDocument = forms.length < config.forms;
        const content = _loc('CHRISPREMADES.Macros.All.WildShape.ChooseForm') +
            (addNoneDocument ? _loc('CHRISPREMADES.Macros.All.WildShape.ChooseNewForm') : '.');
        selected = await dialogUtils.selectDocumentDialog(workflow.item.name, content, forms, {showCR: true, displayReference: true, addNoneDocument});
    }
    if (!selected && forms.length >= config.forms) return;
    const excludeMovement = [];
    if (!config.canFly) excludeMovement.push('fly');
    if (!config.canSwim) excludeMovement.push('swim');
    const choice = await compendiumUtils.selectActor({
        hint: _loc('CHRISPREMADES.Macros.All.WildShape.Choose'),
        creatureTypes: config.creatureTypes,
        title: workflow.item.name,
        icon: workflow.item.img,
        packIds: config.packs,
        maxCR: config.cr,
        excludeMovement
    });
    if (!choice?.length) return;
    if (!selected) {
        wildShapeActivity.profiles.push({_id: foundry.utils.randomID(), uuid: choice[0].uuid});
    } else {
        const profile = wildShapeActivity.profiles.find(p => p.uuid === selected.uuid);
        profile.uuid = choice[0].uuid;
    }
    await documentUtils.update(wildShapeActivity, {profiles: wildShapeActivity.profiles});
}
async function preWildShape({actor, config, document: activity, token}) {
    if (config.midiOptions['chris-premades']?.wildShape) return;
    if (activity.item.system.uses.max && !activity.item.system.uses.value) return;
    const options = await getConfigs(activity.item);
    if (!options) return true;
    const rules = documentUtils.getRules(activity.item);
    const forms = (await Promise.all(activity.profiles.map(async p => ({actor: await fromUuid(p.uuid), id: p._id})))).filter(Boolean);
    const additional = await automationUtils.calledEvent('wildShapeForms', actor, {canOverlap: true, multiResult: true, data: {
        ...options,
        activity,
        actor,
        rules
    }});
    const additionalMap = new Map();
    const additionalForms = additional?.flat().filter(a => a?.actor).map(a => {
        if (a.source) {
            if (!additionalMap.has(a.actor.uuid)) additionalMap.set(a.actor.uuid, [a.source]);
            else additionalMap.get(a.actor.uuid).push(a.source);
        } else if (!additionalMap.has(a.actor.uuid)) additionalMap.set(a.actor.uuid, []);
        return {actor: a.actor, id: a.actor.uuid, source: a.source};
    });
    forms.push(...additionalForms);
    if (!forms.length) {
        Logging.addMacroWarning('CPR', 'wild-shape', 'CHRISPREMADES.Macros.All.WildShape.NoForms', {notify: 'warn'});
        return true;
    }
    const getTags = data => {
        const a = data.actor;
        const tags = [{label: _loc('DND5E.CRLabel', {cr: dnd5e.utils.formatCR(a.system.details.cr || 0, {narrow: false})}), id: 'cr'}];
        if (rules === '2014') tags.push({label: `${_loc('DND5E.HP')} ${a.system.attributes.hp.effectiveMax}`, id: 'hp'});
        tags.push(
            {label: `${_loc('DND5E.AC')} ${a.system.attributes.ac.value}`, id: 'ac'},
            ...Object.entries(CONFIG.DND5E.movementTypes).map(([key, {label, hidden}]) => {
                const value = a.system.attributes.movement.speeds[key];
                return (value && !hidden) ? {label: `${label} ${value}`, id: key} : false;
            }).filter(Boolean),
            ...Object.entries(CONFIG.DND5E.senses).map(([key, {label}]) => {
                const value = a.system.attributes.senses.ranges[key];
                return value ? {label: `${label} ${value}`, id: key} : false;
            }).filter(Boolean)
        );
        if (data.source) tags.push({label: data.source.name, id: 'source'});
        return tags;
    };
    const inputs = [['radio', forms.map(f => ({
        label: f.actor.name,
        name: f.id,
        options: {
            image: f.actor.img,
            isChecked: f.id === activity.flags['chris-premades']?.previousShape,
            tags: getTags(f)
        }
    })), {displayAsRows: true, legend: 'CHRISPREMADES.Macros.All.WildShape.KnownForms', radioName: 'shape'}]];
    if (!inputs[0][1].some(radio => radio.options.isChecked)) inputs[0][1][0].options.isChecked = true;
    const equipment = actor.items.filter(i => i.system.equipped && i.type !== 'container');
    if (equipment.length) {
        equipment.sort((a, b) => b.name.localeCompare(a.name, game.i18n.lang));
        const entries = await Promise.all(equipment.map(async e => ({
            label: e.name,
            name: 'items.' + e.id,
            options: {
                tooltip: await uiUtils.enrichHTML(e.system.description.value, e.getRollData()),
                isChecked: e.flags['chris-premades']?.wildShape?.wear,
                image: e.img
            }
        })));
        inputs.push(['checkbox', entries, {displayAsRows: true, legend: 'TYPES.Item.equipment'}]);
    }
    const choices = await applications.DialogApp.dialog(activity.item.name, 'CHRISPREMADES.Macros.All.WildShape.Prompt', inputs, 'okCancel');
    if (!choices?.buttons) return true;
    const keepItems = [];
    const itemChoices = Object.entries(choices.items ?? {});
    if (itemChoices.length) {
        const updates = [];
        for (const [id, keep] of itemChoices) {
            const item = actor.items.get(id);
            if (!item) continue;
            if (keep) keepItems.push(item);
            if (!!item.flags['chris-premades']?.wildShape?.wear === keep) continue;
            updates.push({_id: id, 'flags.chris-premades.wildShape.wear': keep});
        }
        if (updates.length) await documentUtils.updateEmbeddedDocuments(actor, 'Item', updates);
    }
    await documentUtils.update(activity, {'flags.chris-premades.previousShape': choices.shape});
    const usedAdditional = additionalMap.get(choices.shape);
    const rollOptions = {
        config: {transform: {profile: choices.shape}},
        options: {'chris-premades': {wildShape: true, wildShapeItems: keepItems.map(item => item.uuid)}}
    };
    if (usedAdditional) {
        for (const source of usedAdditional) {
            if (source.documentName === 'Activity') await workflowUtils.syntheticActivityRoll(source);
            else if (source.documentName === 'Item') await workflowUtils.syntheticItemRoll(source);
        }
        const refetchedItem = activity.actor.items.get(activity.item.id);
        const activityData = activity.toObject();
        const id = foundry.utils.randomID();
        activityData.profiles?.push({_id: id, uuid: choices.shape});
        genericUtils.setProperty(rollOptions, 'config.transform.profile', id);
        await workflowUtils.syntheticActivityDataRoll(activityData, refetchedItem, [token], rollOptions);
    } else {
        await workflowUtils.syntheticActivityRoll(activity, [token], rollOptions);
    }
    return true;
}
async function postWildShape({identifier, workflow}) {
    const newActor = workflow.transformedActors?.[0];
    if (!newActor) return;
    const effectID = workflow.item.effects.contents[0]?.id;
    if (!effectID) return Logging.addMacroWarning('CPR', identifier, 'Wild Shape effect missing from item.', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(workflow.activity, effectID);
    const keepItems = (workflow.workflowOptions['chris-premades']?.wildShapeItems ?? []).map(uuid => fromUuidSync(uuid, {strict: false})).filter(Boolean);
    const revertFeature = await compendiumUtils.getDocumentByIdentifier(cpr.packs.misc.automationItems, 'wild-shape-revert', {
        translate: 'CHRISPREMADES.Macros.All.WildShape.Revert',
        object: true
    });
    if (!revertFeature) return Logging.addMacroWarning('CPR', identifier, 'Wild Shape Revert item not found.', {notify: 'warn'});
    const rules = documentUtils.getRules(workflow.item);
    const classItem = getClassItem(workflow.item);
    await automationUtils.calledEvent('wildShape', workflow.actor, {canOverlap: true, data: {
        actor: workflow.actor,
        classIdentifier: classItem?.identifier,
        classLevel: classItem?.system.levels ?? 0,
        effectData,
        keepItems,
        newActor,
        rules
    }});
    const effect = await effectUtils.createEffects(newActor, [effectData], {vae: [{type: 'use', name: revertFeature.name, itemIdentifier: 'wild-shape-revert'}]});
    if (!effect || !effect[0]) return;
    const itemData = keepItems.map(i => i instanceof Item.implementation ? i.toObject() : i);
    genericUtils.setProperty(revertFeature, 'flags.dnd5e.dependentOn', effect[0].uuid);
    itemData.push(revertFeature);
    await documentUtils.createEmbeddedDocuments(newActor, 'Item', itemData, {keepId: true});
    const revert = actorUtils.getItemByIdentifier(newActor, 'wild-shape-revert');
    if (revert) await actorUtils.addFavorites(newActor, [revert]);
}
async function revert({workflow}) {
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'wild-shape-effect');
    if (effect) await documentUtils.deleteDocument(effect);
    else await calledRevert(workflow.actor);
}
async function calledRevert(actor, overflowDamage) {
    return await wildShapeExpire({document: {parent: actor}, overflowDamage});
}
async function wildShapeExpire({document: effect, overflowDamage}) {
    const wildShaped = effect.parent;
    const transformOptions = wildShaped.flags.dnd5e?.transformOptions;
    const syncSlots = !transformOptions?.keep?.includes('spells') && !transformOptions?.spellLists?.length;
    const slots = Object.entries(wildShaped.system.spells ?? {}).filter(([, slot]) => slot.max);
    const items = wildShaped.items.contents;
    const conditions = wildShaped.effects.filter(eff => effectUtils.getConditions(eff).size);
    const reverted = await wildShaped.revertOriginalForm();
    const original = reverted instanceof TokenDocument.implementation ? reverted.actor : reverted;
    if (!original) return;
    const updates = [];
    const itemUpdates = [];
    for (const item of items) {
        const originalItem = original.items.get(item.id);
        if (!originalItem) continue;
        const data = {};
        const iSpent = item.system.uses?.spent;
        if (item.hasLimitedUses && originalItem.system.uses.spent !== iSpent)
            genericUtils.setProperty(data, 'system.uses.spent', iSpent);
        for (const activity of item.system.activities ?? []) {
            if (!activity.uses?.max) continue;
            const aSpent = activity.uses.spent;
            const originalActivity = originalItem.system.activities.get(activity.id);
            if (originalActivity.uses.spent === aSpent) continue;
            genericUtils.setProperty(data, `system.activities.${activity.id}.uses.spent`, aSpent);
        }
        if (!genericUtils.isEmpty(data)) itemUpdates.push({_id: item.id, ...data});
    }
    if (itemUpdates.length) updates.push({action: 'update', documentName: 'Item', parent: original, updates: itemUpdates});
    const conditionAdd = conditions.filter(eff => !original.effects.get(eff.id)).map(eff => eff.toObject());
    const conditionRemove = original.effects.filter(eff => effectUtils.getConditions(eff).size && !conditions.some(c => c.id === eff.id)).map(eff => eff.id);
    if (conditionAdd.length) updates.push({action: 'create', documentName: 'ActiveEffect', parent: original, data: conditionAdd, keepId: true});
    if (conditionRemove.length) updates.push({action: 'delete', documentName: 'ActiveEffect', parent: original, ids: conditionRemove});
    if (updates.length) await documentUtils.modifyBatch(updates);
    const slotUpdates = {};
    if (syncSlots) {
        for (const [key, slot] of slots) {
            if (original.system.spells[key]?.value !== slot.value) slotUpdates[`system.spells.${key}.value`] = slot.value;
        }
    }
    if (!genericUtils.isEmpty(slotUpdates)) await documentUtils.update(original, slotUpdates);
    if (!overflowDamage) return;
    const token = actorUtils.getFirstToken(original);
    await workflowUtils.applyDamage([token], overflowDamage, 'none');
}
export const wildShape = {
    name: 'Wild Shape',
    version: '2.1.7',
    rules: 'all',
    notes: 'Use the "actorWildShape" called event (async) to modify the wild shape active effect and worn items.\n\tData available: actor, classIdentifier, classLevel, newActor, keepItems, effectData, rules.\nUse the "actorWildShapeForms" called event (async) to provide additional actor documents as choices. Return {actor, source}, where source is the granting item and will be rolled if the actor is used.\n\tData available: activity, actor, canFly, canSwim, cr, creatureTypes, packs, rules.',
    revert: calledRevert,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preWildShape,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: postWildShape,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        forms: {
            default: '@scale.druid.known-forms',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.All.WildShape.KnownForms',
            category: 'behavior'
        },
        cr: {
            default: '@scale.druid.challenge-rating',
            type: 'formula',
            label: 'CHRISPREMADES.Macros.All.WildShape.MaxCR',
            category: 'behavior'
        },
        grantFlySpeed: {
            default: 8,
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.WildShape.GrantFlySpeed',
            category: 'behavior',
            get options() { return constants.characterLevelOptions; }
        },
        grantSwimSpeed: {
            default: 4,
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.WildShape.GrantSwimSpeed',
            category: 'behavior',
            get options() { return constants.characterLevelOptions; }
        },
        creatureTypes: {
            default: ['beast'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'behavior',
            get options() { return constants.creatureTypeOptions; }
        },
        packs: {
            default: [],
            type: 'packOrFolderMultiSelect',
            mode: 'pack',
            label: 'CHRISPREMADES.Macros.All.WildShape.FormCompendiums',
            hint: 'CHRISPREMADES.Macros.All.WildShape.FormCompendiumsHint',
            category: 'linked'
        }
    },
    scales: [
        {
            identifier: 'challenge-rating',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'challenge-rating',
                    type: 'cr',
                    scale: {
                        2: {value: 0.25},
                        4: {value: 0.5},
                        8: {value: 1}
                    }
                },
                value: {},
                title: 'Wild Shape CR'
            }
        }
    ]
};
export const wildShapeRevert = {
    version: wildShape.version,
    rules: wildShape.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: revert,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: wildShapeExpire,
            priority: 50
        }
    ]
};
export const wildShapeChooseForms = {
    version: wildShape.version,
    rules: wildShape.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: learnForm,
            priority: 50
        }
    ]
};
