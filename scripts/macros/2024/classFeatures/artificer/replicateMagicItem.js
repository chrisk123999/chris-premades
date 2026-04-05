import {CompendiumBrowser} from '../../../../applications/compendiumBrowser.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function selectPlans({trigger: {entity: item}, workflow}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifierPlan = itemUtils.getConfig(item, 'scaleIdentifierPlan');    
    let maxPlans = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifierPlan]?.value;
    if (!maxPlans) return;
    let existing = itemUtils.getAllItemsByIdentifier(workflow.actor, 'magicItemPlan').filter(i => i.flags['chris-premades']?.artificerPlanTemplateUuid);
    if (existing.length > maxPlans) return genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.MagicItemPlan.Max', {count: existing.length, max: maxPlans}), 'warn');
    let selected = await fromUuid(workflow.workflowOptions['chris-premades']?.preselectedArtificerPlan);
    if (!selected && existing.length > 0) {
        let addNoneDocument = existing.length < maxPlans;
        let content = genericUtils.translate('CHRISPREMADES.Macros.MagicItemPlan.ChooseSwapPlan') +
            (addNoneDocument ? genericUtils.translate('CHRISPREMADES.Macros.MagicItemPlan.ChooseNewPlan') : '.');
        selected = await dialogUtils.selectDocumentDialog(item.name, content, existing, {displayToolTips: true, addNoneDocument});
    }
    if (selected === false) return;
    let types = itemUtils.getConfig(workflow.item, 'itemTypes') || [];
    let rarities = ['common', 'uncommon'];
    let unavailable = ['legendary', '_blank'];
    let level = workflow.actor.classes[classIdentifier]?.system.levels ?? 2;
    if (level < 6) unavailable.push('rare');
    else rarities.push('rare');
    if (level < 14) unavailable.push('veryRare');
    else rarities.push('veryRare');
    let plan = await CompendiumBrowser.select(
        CompendiumBrowser.tabs.items,
        [
            ['documentTypes', types],
            ['properties', ['mgc'], {locked: true}],
            ['rarity', unavailable, {exclude: true, locked: true}],
            ['rarity', rarities]
        ],
        {
            hint: 'CHRISPREMADES.Macros.MagicItemPlan.Choose',
            maxAmount: 1
        }
    );
    if (!plan) return;
    plan = plan[0];
    let data = {
        name: `${genericUtils.translate('CHRISPREMADES.Macros.MagicItemPlan.ItemName')}: ${plan.name}`,
        flags: {
            'chris-premades': {artificerPlanTemplateUuid: plan.uuid},
            dnd5e: {advancementOrigin: workflow.actor.classes[classIdentifier]?.id ?? ''}
        },
        system: {
            description: {value: plan.system.description.value ?? ''}
        }
    };
    if (!selected) {
        let planTemplate = await compendiumUtils.getItemFromCompendium(constants.modernPacks.featureItems, 'magicItemPlan', {byIdentifier: true, object: true});
        await itemUtils.createItems(workflow.actor, [genericUtils.mergeObject(planTemplate, data)]);
    } else {
        let createdPlans = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'createdItemPlan');
        let thisPlan = createdPlans.find(p => p.origin === selected.uuid);
        if (thisPlan) await genericUtils.remove(thisPlan);
        await genericUtils.update(selected, data);
    }
}
async function createItem({trigger: {entity: item}, workflow}) {
    if (itemUtils.getConfig(item, 'requireTools') && !workflow.actor.items.some(i => i.system.type?.baseItem === 'tinker')) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.TinkersMagic.NeedTools', {itemName: item.name}), 'warn');
        return;
    }
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifierItem = itemUtils.getConfig(item, 'scaleIdentifierItem');    
    let maxItems = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifierItem]?.value;
    if (!maxItems) return;
    let existing = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'createdItemPlan');
    if (existing.length >= maxItems) return genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.ReplicateMagicItem.MaxCreated', {count: existing.length, max: maxItems}), 'warn');
    let selected = await fromUuid(workflow.workflowOptions['chris-premades']?.preselectedArtificerPlan);
    if (selected && existing.some(e => e.origin === selected.uuid))
        return genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.ReplicateMagicItem.AlreadyCreated', {itemName: selected.name}), 'warn');
    if (!selected) {
        let plans = itemUtils.getAllItemsByIdentifier(workflow.actor, 'magicItemPlan');
        if (!plans.length) return genericUtils.notify('CHRISPREMADES.Macros.ReplicateMagicItem.NoPlans', 'warn');
        plans = plans.filter(p => !existing.some(e => e.origin === p.uuid));
        if (!plans.length) return;
        selected = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.ReplicateMagicItem.Prompt', plans, {displayTooltips: true});
    }
    if (!selected) return;
    let data = await fromUuid(selected.flags['chris-premades']?.artificerPlanTemplateUuid);
    if (!data) return genericUtils.notify('CHRISPREMADES.Macros.ReplicateMagicItem.NotFound', 'warn');
    data = data.toObject();
    genericUtils.setProperty(data.flags, 'chris-premades.originalRarity', data.system.rarity ?? '');
    genericUtils.setProperty(data.flags, 'chris-premades.artificerMagicItem', selected.uuid);
    if (itemUtils.getConfig(item, 'makeArtifact')) data.system.rarity = 'artifact';
    let itemHolder = await fromUuid(workflow.workflowOptions['chris-premades']?.artificerItemHolder) ?? workflow.targets.first()?.actor ?? workflow.actor;
    let createdItem = await itemUtils.createItems(itemHolder, [data]);
    if (!createdItem?.length) return;
    createdItem = createdItem[0];
    await effectUtils.createEffect(workflow.actor, {
        name: createdItem.name,
        img: selected.img,
        origin: selected.uuid,
        flags: {
            dae: {
                stackable: 'noneName'
            }
        }
    }, {identifier: 'createdItemPlan', parentEntity: createdItem, strictlyInterdependent: true});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
    let planTemplate = await compendiumUtils.getItemFromCompendium(constants.modernPacks.featureItems, 'magicItemPlan', {byIdentifier: true});
    if (!planTemplate) return;
    await markPlansNotPrepared(item.parent, planTemplate);
}
async function swapPlan({trigger: {entity: item}, actor}) {
    return await rollFeature(actor, 'selectPlans', item);
}
async function createItemFromPlan({trigger: {entity: item}, actor}) {
    if (item.flags['chris-premades']?.artificerPlanTemplateUuid)
        return await rollFeature(actor, 'createItem', item);
    await markPlansNotPrepared(actor, item);
    return true;
}
// helpers
async function markPlansNotPrepared(actor, template) {
    let planName = genericUtils.translate('CHRISPREMADES.Macros.MagicItemPlan.ItemName');
    let unpreparedPlans = actor.items.filter(i => !i.flags['chris-premades']?.artificerPlanTemplateUuid && i.name.includes(planName));
    if (!unpreparedPlans.length) return;
    let notPrepared = genericUtils.translate('CHRISPREMADES.Macros.MagicItemPlan.NotPrepared');
    let itemName = i => i.name.split(':')[1]?.trim() || i.name;
    let updates = unpreparedPlans.map(p => genericUtils.mergeObject(template.toObject(), {
        _id: p._id,
        name: `${notPrepared} ${planName}: ${itemName(p)}`
    }));
    let activity = activityUtils.getActivityByIdentifier(template, 'swapPlan', {strict: true});
    if (activity) genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.MagicItemPlan.NotPreparedPrompt', {itemList: unpreparedPlans.map(i => itemName(i)).join(', '), activityName: activity.name}), 'warn');
    await genericUtils.updateEmbeddedDocuments(actor, 'Item', updates);
}
async function rollFeature(actor, activityID, item) {
    let feature = itemUtils.getItemByIdentifier(actor, 'replicateMagicItem');
    if (!feature) return true;
    let activity = activityUtils.getActivityByIdentifier(feature, activityID, {strict: true});
    if (!activity) return true;
    await workflowUtils.syntheticActivityRoll(activity, [], {
        options: {
            workflowOptions: {
                'chris-premades': {
                    preselectedArtificerPlan: item.uuid
                }
            }
        }
    });
    return true;
}
export let replicateMagicItem = {
    name: 'Replicate Magic Item',
    version: '1.5.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: selectPlans,
                priority: 50,
                activities: ['selectPlans']
            },
            {
                pass: 'rollFinished',
                macro: createItem,
                priority: 50,
                activities: ['createItem']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 100
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 100
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 100
        }
    ],
    config: [
        {
            value: 'requireTools',
            label: 'CHRISPREMADES.Macros.TinkersMagic.RequireTools',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        },        
        {
            value: 'makeArtifact',
            label: 'CHRISPREMADES.Macros.ReplicateMagicItem.MakeArtifact',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'itemTypes',
            label: 'CHRISPREMADES.Config.ItemTypes',
            type: 'select-many',
            default: ['weapon', 'equipment', 'consumable', 'tool', 'container'],
            options: constants.itemOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'artificer',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifierItem',
            label: 'CHRISPREMADES.Macros.ReplicateMagicItem.ScaleIdentifierItem',
            type: 'text',
            default: 'replicate-magic-item',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifierPlan',
            label: 'CHRISPREMADES.Macros.ReplicateMagicItem.ScaleIdentifierPlan',
            type: 'text',
            default: 'magic-item-plans',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifierItem',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'replicate-magic-item',
                    type: 'number',
                    distance: {units: ''},
                    scale: {
                        2: {value: 2},
                        6: {value: 3},
                        10: {value: 4},
                        14: {value: 5},
                        18: {value: 6}
                    }
                },
                value: {},
                title: 'Replicate Magic Item'
            }
        },
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifierPlan',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'magic-item-plans',
                    type: 'number',
                    distance: {units: ''},
                    scale: {
                        2: {value: 4},
                        6: {value: 5},
                        10: {value: 6},
                        14: {value: 7},
                        18: {value: 8}
                    }
                },
                value: {},
                title: 'Magic Item Plans'
            }
        } 
    ]
};
export let magicItemPlan = {
    name: 'Magic Item Plan',
    aliases: ['Magic Item Plans'],
    version: replicateMagicItem.version,
    rules: replicateMagicItem.rules,
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: swapPlan,
                priority: 40,
                activities: ['swapPlan']
            },
            {
                pass: 'preTargeting',
                macro: createItemFromPlan,
                priority: 40,
                activities: ['createItem']
            }
        ]
    }
};
