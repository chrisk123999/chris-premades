import {actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../../proxy.mjs';
import {default as cpr} from '../../../../constants.mjs';
const keys = {
    swapActivity: 'swap-plan',
    createActivity: 'create-plan',
    infusionIdentifier: 'infusion',
    itemHolder: 'artificerItemHolder',
    planIdentifier: 'magic-item-plans',
    createdItemFlag: 'artificerMagicItem',
    calledEventPass: 'artificerPlanFilter',
    planTemplateFlag: 'artificerPlanTemplateUuid',
    preselectedMarker: 'preselectedArtificerPlan',
    createdEffectIdentifier: 'createdArtificerPlan'
};
async function swapPlan({macroClass: {identifier, source}, workflow}) {
    const data = await getConfig(workflow, source, identifier);
    if (!data) return;
    data.packIds = [];
    data.predicates = [];
    data.tab = 'physical';
    if (data.compendium?.length) data.packIds = data.compendium.map(c => c.split(':')[1]);
    const existing = getPlansAndInfusions(workflow.actor, source);
    if (existing.length > data.known)
        return genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.MaxKnown', {type: 'warn', format: {count: existing.length, max: data.known}});
    let selected = await fromUuid(workflowUtils.getWorkflowProperty(workflow, keys.preselectedMarker));
    if (!selected && existing.length > 0) {
        const belowLimit = existing.length < data.known;
        const prompt = _loc('CHRISPREMADES.Macros.All.ArtificerPlans.ChooseSwapPlan');
        if (belowLimit) {
            const template = await getPlanTemplate(identifier, source);
            if (template) {
                template.name = _loc('CHRISPREMADES.Macros.All.ArtificerPlans.LearnNew');
                template.id = 'makeNewPlan';
                existing.push(template);
            }
        }
        selected = await dialogUtils.selectDocumentDialog(workflow.item.name, prompt, existing, {displayTooltips: true});
    }
    if (!selected) return Logging.addMacroWarning(source, identifier, 'Artificer plan swap exited early due to a declined prompt.');
    if (selected.id === 'makeNewPlan') selected = false;
    await automationUtils.calledEvent(keys.calledEventPass, workflow.actor, {canOverlap: true, data});
    if (data.itemTypes?.length) genericUtils.setProperty(data, 'lockedFilters.types', new Set(data.itemTypes));
    if (data.predicates?.length) data.filterPredicate = entry => data.predicates.every(fn => fn(entry));
    const plan = (await compendiumUtils.selectFromCompendiumBrowser(data.tab, {
        maxAmount: 1,
        icon: workflow.item.img,
        title: workflow.item.name,
        hint: _loc('CHRISPREMADES.Macros.All.ArtificerPlans.Choose'),        
        ...data
    }))?.[0];
    if (!plan) return;
    let planData;
    const options = {};
    const planIsInfusion = documentUtils.getIdentifier(plan).startsWith(keys.infusionIdentifier);
    if (planIsInfusion) {
        planData = plan.toObject();
        options.recursive = false;
        options.diff = false;
    } else {
        planData = {
            name: `${_loc(`CHRISPREMADES.Macros.Modern.ReplicateMagicItem.PlanName`)}: ${plan.name}`,
            flags: {[source]: {[keys.planTemplateFlag]: plan.uuid}},
            system: {description: {value: plan.system.description.value ?? ''}}
        };
    }
    genericUtils.setProperty(planData, 'flags.dnd5e.advancementOrigin', workflow.actor.classes[data.classIdentifier]?.id ?? '');
    if (!selected) {
        if (!planIsInfusion) {
            const template = await getPlanTemplate(identifier, source);
            if (!template) return;
            planData.name = `${template.name}: ${plan.name}`;
            planData = genericUtils.mergeObject(template, planData);
        }
        await itemUtils.createItems(workflow.actor, [planData]);
    } else {
        if (!planIsInfusion && documentUtils.getIdentifier(selected).startsWith(keys.infusionIdentifier)) {
            const template = await getPlanTemplate(identifier, source);
            if (!template) return;
            planData.name = `${template.name}: ${plan.name}`;
            planData = genericUtils.mergeObject(template, planData);
            options.recursive = false;
            options.diff = false;
        }
        const created = actorUtils.getEffectByIdentifier(workflow.actor, keys.createdEffectIdentifier, {multiple: true});
        const thisPlan = created.find(p => p.origin === selected.uuid);
        if (thisPlan) await documentUtils.deleteDocument(thisPlan); // created item or infusion should be dependent on this effect
        await documentUtils.update(selected, planData, options);
    }
}
async function usePlan({macroClass: {identifier, source}, workflow}) {
    const config = await getConfig(workflow, source, identifier);
    if (!config) return;
    if (config.requireTools?.length && !workflow.actor.itemTypes.tool.some(t => t.system.equipped && config.requireTools.includes(t.system.type?.baseItem))) {
        const tools = constants.toolOptions.filter(o => config.requireTools.includes(o.value)).map(t => t.label).join(', ');
        return genericUtils.notify('CHRISPREMADES.Macros.Modern.TinkersMagic.NeedTools', {type: 'warn', format: {feature: workflow.item.name, tools}});
    }
    const created = actorUtils.getEffectByIdentifier(workflow.actor, keys.createdEffectIdentifier, {multiple: true});
    if (created.length >= config.createdLimit) 
        return genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.MaxCreated', {type: 'warn', format: {count: created.length, max: config.createdLimit}});
    let selected = await fromUuid(workflowUtils.getWorkflowProperty(workflow, keys.preselectedMarker));
    if (selected && created.some(e => e.origin === selected.uuid))
        return genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.AlreadyCreated', {type: 'warn', format: {item: selected.name}});
    if (!selected) {
        let plans = getPlansAndInfusions(workflow.actor, source);
        if (!plans.length) return genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.NoPlans', {type: 'warn'});
        plans = plans.filter(p => !created.some(c => c.origin === p.uuid));
        if (!plans.length) return genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.AllCreated', {type: 'warn'});
        selected = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.ArtificerPlans.Create', plans, {displayTooltips: true});
    }
    if (!selected) return;
    const itemHolder = await fromUuid(workflowUtils.getWorkflowProperty(workflow, keys.itemHolder)) ?? workflow.targets.first()?.document ?? workflow.token.document;
    if (documentUtils.getIdentifier(selected).startsWith(keys.infusionIdentifier)) {
        const infusionActivity = itemUtils.getActivityByIdentifier(selected, keys.createActivity);
        if (!infusionActivity) 
            return Logging.addMacroWarning(source, identifier, `Artificer infusion failed due to missing create activity with identifier: ${keys.createActivity}`);
        return await workflowUtils.syntheticActivityRoll(infusionActivity, [itemHolder]); // infusion macro expected to hook up dependent active effect
    }
    const data = (await fromUuid(selected.flags[source]?.[keys.planTemplateFlag]))?.toObject();
    if (!data) return genericUtils.notify('CHRISPREMADES.Macros.Modern.ReplicateMagicItem.NotFound', {type: 'warn', format: {item: selected.name}});
    genericUtils.setProperty(data, `flags.${source}.${keys.createdItemFlag}`, selected.uuid);
    const createdItem = (await itemUtils.createItems(itemHolder.actor, [data]))?.[0];
    if (!createdItem) return Logging.addMacroWarning(source, identifier, `Artificer replicate item failed to create item. (plan name) ${selected.name} (plan uuid) ${selected.uuid}`);
    const parentEffect = (await effectUtils.createEffects(workflow.actor, [{
        name: createdItem.name,
        img: selected.img,
        origin: selected.uuid,
        flags: {
            cat: {identifier: keys.createdEffectIdentifier},
            dae: {stackable: 'noneName'}
        }
    }], {parentEntity: createdItem}))?.[0];
    if (!parentEffect) return Logging.addMacroWarning(source, identifier, `Artificer replicate item failed to create parent effect. (plan name) ${selected.name} (plan uuid) ${selected.uuid}`);
    await documentUtils.makeDependent(parentEffect, [createdItem]);
}
async function added({actor, macroClass: {identifier, rules, source}}) {
    if (rules !== '2024') return; 
    const template = await getPlanTemplate(identifier, source);
    if (template) await markPlansNotPrepared(source, actor, template);
}
async function fromPlanSwapPlan({actor, document: activity}) {
    return await rollFeature(actor, keys.swapActivity, activity.item);
}
async function fromPlanCreatePlan({actor, document: activity, macroClass: {source}}) {
    if (activity.item.flags[source]?.[keys.planTemplateFlag])
        return await rollFeature(actor, keys.createActivity, activity.item);
    await markPlansNotPrepared(source, actor, activity.item);
    return true;
}
// helpers
async function getConfig(workflow, source, identifier) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(swapArtificerPlan.config));
    const data = {
        ...config,
        createdLimit: (await rollUtils.rollDice(config.limit, {document: workflow.activity}))?.total ?? 0,
        known: (await rollUtils.rollDice(config.known, {document: workflow.activity}))?.total ?? 0
    };
    if (data.known && data.createdLimit) return data;
    Logging.addMacroWarning(source, identifier, `Artificer class scale formula could not be evaluated: (known plans) ${config.known} | (created limit) ${config.limit}`);
}
function getPlansAndInfusions(actor, source) {
    const all = [];
    for (const item of actor.itemTypes.feat) {
        const id = documentUtils.getIdentifier(item);
        if (id.startsWith(keys.planIdentifier)) {
            if (!item.flags[source]?.[keys.planTemplateFlag]) continue;
            all.push(item);
            continue;
        }
        if (id.startsWith(keys.infusionIdentifier)) all.push(item);
    }
    return all;
}
async function getPlanTemplate(identifier, source) {
    const template = await compendiumUtils.getDocumentByIdentifier(cpr.packs.modern.features, keys.planIdentifier, {object: true});
    if (!template) {
        Logging.addMacroWarning(source, identifier, `Missing pack item for modern artificer plans! (pack) ${cpr.packs.modern.features} | (identifier) ${keys.planIdentifier}`);
        return;
    }
    return template;
}
async function markPlansNotPrepared(source, actor, planTemplate) {
    const unprepared = actor.itemTypes.feat.filter(
        i => !i.flags[source]?.[keys.planTemplateFlag] && i.name.includes(planTemplate.name)
    );
    if (!unprepared.length) return;
    const notPrepared = _loc('CHRISPREMADES.Macros.All.ArtificerPlans.NotPrepared');
    const itemName = i => i.name.split(':')[1]?.trim() || i.name;
    const updates = unprepared.map(u => genericUtils.mergeObject(genericUtils.duplicate(planTemplate), {
        name: `${notPrepared} ${planTemplate.name}: ${itemName(u)}`,
        _id: u._id
    }));
    genericUtils.notify('CHRISPREMADES.Macros.All.ArtificerPlans.NotPreparedPrompt', {type: 'warn', format: {
        items: unprepared.map(i => itemName(i)).join(', ')
    }});
    await documentUtils.updateEmbeddedDocuments(actor, 'Item', updates);
}
async function rollFeature(actor, activityID, plan) {
    const feature = actorUtils.getItemByIdentifiers(actor, ['replicate-magic-item', 'infuse-item'], {type: 'feat'});
    if (!feature) return true;
    const activity = itemUtils.getActivityByIdentifier(feature, activityID);
    if (!activity) return true;
    const options = {};
    workflowUtils.setWorkflowProperty(options, keys.preselectedMarker, plan.uuid);
    await workflowUtils.syntheticActivityRoll(activity, [], {options});
    return true;
}
export const swapArtificerPlan = {
    version: '2.0.4',
    rules: 'all',
    notes: 'Target a willing creature to create an item or infusion in their inventory. The item is otherwise made on this character.\n\nUse the "actorArtificerPlanFilter" called event (async) to modify the compendium filters used to present plans to learn.\n\tData available: classIdentifier, createdLimit, itemTypes, known, packIds, tab.\nSet additional required filters under "lockedFilters.additional".',
    keys,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: swapPlan,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'munched',
            macro: added,
            priority: 50
        }
    ],
    config: {
        known: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.ArtificerPlans.Known',
            category: 'behavior'
        },
        limit: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.ArtificerPlans.Limit',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'artificer',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        },
        compendium: {
            default: [],
            type: 'packOrFolderMultiSelect',
            documentType: 'Item',
            mode: 'pack',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.All.ArtificerPlans.CustomCompendium',
            hint: 'CHRISPREMADES.Macros.Modern.TinkersMagic.CustomCompendiumHint'
        },
        itemTypes: {
            default: ['consumable', 'container', 'equipment', 'loot', 'tool', 'weapon'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemTypeHint',
            get options() { return constants.physicalItemTypes; }
        },
        requireTools: {
            default: ['tinker'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.TinkersMagic.RequireTools',
            hint: 'CHRISPREMADES.Macros.Modern.TinkersMagic.RequireToolsHint',
            get options() { return constants.toolOptions; }
        }
    }
};
export const useArtificerPlan = {
    version: swapArtificerPlan.version,
    rules: swapArtificerPlan.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: usePlan,
            priority: 50
        }
    ]
};
export const fromPlanSwapArtificerPlan = {
    version: swapArtificerPlan.version,
    rules: swapArtificerPlan.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: fromPlanSwapPlan,
            priority: 50
        }
    ]
};
export const fromPlanCreateArtificerPlan = {
    version: swapArtificerPlan.version,
    rules: swapArtificerPlan.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: fromPlanCreatePlan,
            priority: 50
        }
    ]
};
