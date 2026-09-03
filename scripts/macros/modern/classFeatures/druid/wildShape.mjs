import {automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, rollUtils} from '../../../../proxy.mjs';
async function chooseForm({identifier, workflow}) {
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
    console.log('FORMS', {forms, maxForms});
    if (forms.length > maxForms) return genericUtils.notify(_loc('CHRISPREMADES.Macros.Modern.WildShape.MaxKnown', {count: forms.length, max: maxForms}), {type: 'warn'});
    let selected = await fromUuid(workflow.workflowOptions['chris-premades']?.preselectedWildShape);
    if (!selected && forms.length) {
        const addNoneDocument = forms.length < maxForms;
        const content = _loc('CHRISPREMADES.Macros.Modern.WildShape.ChooseForm') +
            (addNoneDocument ? _loc('CHRISPREMADES.Macros.Modern.WildShape.ChooseNewForm') : '.');
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
async function changeShape({actor, document: activity}) {

}
export const wildShape = {
    name: 'Wild Shape',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: changeShape,
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
            label: 'CHRISPREMADES.Macros.Modern.WildShape.KnownForms',
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
            macro: chooseForm,
            priority: 50
        }
    ]
};
