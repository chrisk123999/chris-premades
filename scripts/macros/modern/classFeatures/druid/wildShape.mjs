import {applications, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, rollUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
async function learnShape({identifier, workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(wildShape.config));
    const classItem = workflow.actor.classes[config.classIdentifier] ?? itemUtils.getAdvancementSourceItem(workflow.item);
    const maxForms = (await rollUtils.rollDice(config.forms, {document: workflow.activity})).total;
    const cr = (await rollUtils.rollDice(config.cr, {document: workflow.activity})).total;
    const packIds = config.packs.map(p => p.split(':')[1]).filter(Boolean);
    const canFly = classItem.system.levels >= (config.grantFlySpeed || 99);
    if (!maxForms) return Logging.addMacroWarning('chris-premades', identifier, 'Could not evaluate wild shape count scale value: ' + config.forms);
    if (cr === undefined) return Logging.addMacroWarning('chris-premades', identifier, 'Could not evaluate wild shape CR scale value: ' + config.cr);
    const wildShapeActivity = itemUtils.getActivityByIdentifier(workflow.item, 'change-shape');
    if (!wildShapeActivity) return Logging.addMacroWarning('chris-premades', identifier, 'Missing wild shape activity: change-shape');
    const forms = (await Promise.all(wildShapeActivity.profiles.map(p => fromUuid(p.uuid)))).filter(Boolean);
    if (forms.length > maxForms) return genericUtils.notify(_loc('CHRISPREMADES.Macros.Modern.WildShape.MaxKnown', {count: forms.length, max: maxForms}), {type: 'warn'});
    let selected = await fromUuid(workflow.workflowOptions['chris-premades']?.preselectedWildShape);
    if (!selected && forms.length) {
        const addNoneDocument = forms.length < maxForms;
        const content = _loc('CHRISPREMADES.Macros.Modern.WildShape.ChooseShape') +
            (addNoneDocument ? _loc('CHRISPREMADES.Macros.Modern.WildShape.ChooseNewShape') : '.');
        selected = await dialogUtils.selectDocumentDialog(workflow.item.name, content, forms, {showCR: true, displayReference: true, addNoneDocument});
    }
    if (!selected && forms.length >= maxForms) return;
    const choice = await compendiumUtils.selectNPCFromCompendiums({
        hint: _loc('CHRISPREMADES.Macros.Modern.WildShape.Choose'),
        excludeMovement: canFly ? [] : ['fly'],
        creatureTypes: config.creatureTypes,
        title: workflow.item.name,
        icon: workflow.item.img,
        maxCR: cr,
        packIds
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
    if (!activity.item.system.uses.value) return;
    const forms = (await Promise.all(activity.profiles.map(async p => ({actor: await fromUuid(p.uuid), id: p._id})))).filter(Boolean);
    if (!forms.length) {
        genericUtils.notify('CHRISPREMADES.Macros.All.WildShape.NoShapes', {type: 'warn'});
        return true;
    }
    const rules = documentUtils.getRules(activity.item);
    const getTags = a => {
        const tags = [{label: _loc('DND5E.CRLabel', {cr: dnd5e.utils.formatCR(a.system.details.cr || 0, {narrow: false})}), id: 'cr'}];
        if (rules === '2014') tags.push({label: `${_loc('DND5E.HP')} ${a.system.attributes.hp.effectiveMax}`, id: 'hp'});
        tags.push(
            {label: `${_loc('DND5E.AC')} ${a.system.attributes.ac.value}`, id: 'ac'},
            ...Object.entries(CONFIG.DND5E.movementTypes).map(([key, {label, hidden}]) => {
                const value = a.system.attributes.movement[key];
                return (value && !hidden) ? {label: `${label} ${value}`, id: key} : false;
            }).filter(Boolean),
            ...Object.entries(CONFIG.DND5E.senses).map(([key, label]) => {
                const value = a.system.attributes.senses.ranges[key];
                return value ? {label: `${label} ${value}`, id: key} : false;
            }).filter(Boolean)
        );
        return tags;
    };
    const inputs = [['radio', forms.map(f => ({
        label: f.actor.name,
        name: f.id,
        options: {
            image: f.actor.img,
            isChecked: f.id === activity.flags['chris-premades']?.previousShape,
            tags: getTags(f.actor)
        }
    })), {displayAsRows: true, legend: 'CHRISPREMADES.Macros.All.WildShape.KnownShapes', radioName: 'shape'}]];
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
    await workflowUtils.syntheticActivityRoll(activity, [token], {
        config: {transform: {profile: choices.shape}},
        options: {'chris-premades': {wildShape: true, wildShapeItems: keepItems}}
    });
    return true;
}
async function postWildShape({workflow}) {
    const keepItems = workflow.workflowOptions['chris-premades']?.wildShapeItems;
    console.log('KEEP ITEMS', keepItems);
}
export const wildShape = {
    name: 'Wild Shape',
    version: '2.0.3',
    rules: '2024',
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
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.WildShape.KnownShapes',
            category: 'behavior'
        },
        cr: {
            default: '@scale.druid.challenge-rating',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.WildShape.MaxCR',
            category: 'behavior'
        },
        grantFlySpeed: {
            default: 8,
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.WildShape.GrantFlySpeed',
            category: 'behavior',
            get options() { return constants.characterLevelOptions(); }
        },
        creatureTypes: {
            default: ['beast'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'behavior',
            get options() { return constants.creatureTypeOptions(); }
        },
        packs: {
            default: [],
            type: 'packOrFolderMultiSelect',
            mode: 'pack',
            label: 'CHRISPREMADES.Macros.All.WildShape.ShapeCompendiums',
            hint: 'CHRISPREMADES.Macros.All.WildShape.ShapeCompendiumsHint',
            category: 'linked'
        }
    },
    scales: [
        {
            identifier: 'wild-shape',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'wild-shape',
                    type: 'number',
                    scale: {
                        2: {value: 2},
                        6: {value: 3},
                        17: {value: 4}
                    }
                },
                value: {},
                title: 'Wild Shape'
            }
        },
        {
            identifier: 'known-forms',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'known-forms',
                    type: 'number',
                    scale: {
                        2: {value: 4},
                        4: {value: 6},
                        8: {value: 8}
                    }
                },
                value: {},
                title: 'Known Forms'
            }
        },
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
                    type: 'number',
                    scale: {
                        2: {value: 0.25},
                        4: {value: 0.5},
                        8: {value: 1}
                    }
                },
                value: {},
                title: 'Wild Shape Challenge Rating'
            }
        }
    ]
};
export const wildShapeChooseForms = {
    version: wildShape.version,
    rules: wildShape.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: learnShape,
            priority: 50
        }
    ]
};
