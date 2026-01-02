import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let classLevels = workflow.actor.classes[classIdentifier]?.system.levels;
    if (!classLevels) return;
    let tier = 1;
    if (classLevels > 13) {
        tier = 3;
    } else if (classLevels > 9) {
        tier = 2;
    }
    let featureIdentifier = 'luminousArrow';
    if (activityIdentifier === 'starryFormChalice') featureIdentifier = 'healingChalice';
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'starryForm');
    let effectData = {
        name: workflow.activity.name,
        img: effect?.img ?? workflow.item.img,
        origin: effect?.origin ?? workflow.item.uuid,
        duration: effect?.duration ?? itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                starryForm: {
                    currentForm: activityIdentifier
                },
                rules: genericUtils.getRules(workflow.item)
            }
        },
        changes: [
            {
                key: 'ATL.light.bright',
                value: 10,
                mode: 4,
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                value: 20,
                mode: 4,
                priority: 20
            },
            {
                key: 'ATL.light.color',
                value: '#ffffff',
                mode: 5,
                priority: 20
            },
            {
                key: 'ATL.light.alpha',
                value: 0.25,
                mode: 5,
                priority: 20
            },
            {
                key: 'ATL.light.animation',
                value: '{type: \'starlight\', speed: 1, intensity: 3}',
                mode: 5,
                priority: 20
            }
        ]
    };
    if (tier === 3) {
        effectData.changes.push(
            {
                key: 'system.traits.dr.value',
                value: 'slashing',
                mode: 2,
                priority: 20
            }, 
            {
                key: 'system.traits.dr.value',
                value: 'piercing',
                mode: 2,
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                value: 'bludgeoning',
                mode: 2,
                priority: 20
            }
        );
    }
    if (activityIdentifier === 'starryFormDragon') {
        effectData.changes.push(
            {
                key: 'system.abilities.wis.check.roll.min',
                value: 10,
                mode: 4,
                priority: 20
            },
            {
                key: 'system.abilities.int.check.roll.min',
                value: 10,
                mode: 4,
                priority: 20
            },
            {
                key: 'system.attributes.concentration.roll.min',
                value: 10,
                mode: 4,
                priority: 20
            }
        );
        if (tier > 1) {
            effectData.changes.push(
                {
                    key: 'system.attributes.movement.fly',
                    value: genericUtils.convertDistance(20),
                    mode: 4,
                    priority: 20
                },
                {
                    key: 'system.attributes.movement.hover',
                    value: 1,
                    mode: 5,
                    priority: 20
                }
            );
        }
    }
    if (tier > 1) effectUtils.addMacro(effectData, 'combat', ['starryFormActive']);
    if (activityIdentifier === 'starryFormChalice') effectUtils.addMacro(effectData, 'midi.actor', ['starryFormActive']);
    if (effect) await genericUtils.remove(effect);
    let opts = {
        identifier: 'starryForm'
    };
    if (activityIdentifier === 'starryFormArcher') {
        let feature = activityUtils.getActivityByIdentifier(workflow.item, featureIdentifier, {strict: true});
        if (!feature) return;
        opts.vae = [{
            type: 'use',
            name: feature.name,
            identifier: 'starryForm',
            activityIdentifier: featureIdentifier
        }];
        opts.unhideActivities = {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: [featureIdentifier],
            favorite: true
        };
    }
    await effectUtils.createEffect(workflow.actor, effectData, opts);
}
async function turnStart({trigger: {entity: effect, token}}) {
    let twinklingItem = await itemUtils.getItemByIdentifier(token.actor, 'twinklingConstellations');
    let starryItem = await itemUtils.getItemByIdentifier(token.actor, 'starryForm');
    let currentForm = effect.flags['chris-premades'].starryForm.currentForm;
    let formIdentifiers = ['starryFormArcher', 'starryFormChalice', 'starryFormDragon'];
    formIdentifiers.splice(formIdentifiers.findIndex(i => i === currentForm), 1);
    let features = formIdentifiers.map(i => activityUtils.getActivityByIdentifier(starryItem, i));
    let selection = await dialogUtils.buttonDialog(twinklingItem.name, 'CHRISPREMADES.Macros.StarryForm.Change', features.map((i,idx) => [i.name, idx + 1]).concat([['CHRISPREMADES.Generic.No', false]]), {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    await workflowUtils.syntheticActivityRoll(features[selection - 1]);
}
async function late({trigger: {entity: effect}, workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.targets.size || !workflow.item.system.level) return;
    if (!workflow.damageItem?.damageDetail?.some(i => i.type === 'healing')) return;
    let chaliceFeature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'healingChalice', {strict: true});
    if (!chaliceFeature) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 30, 'ally', {includeIncapacitated: true, includeToken: true});
    let selected;
    if (nearbyTargets.length > 1) {
        selected = await dialogUtils.selectTargetDialog(chaliceFeature.name, 'CHRISPREMADES.Macros.StarryForm.Heal', nearbyTargets);
        if (selected?.length) selected = selected[0];
    }
    if (!selected) selected = nearbyTargets[0];
    await workflowUtils.syntheticActivityRoll(chaliceFeature, [selected], {config: {
        scaling: (workflow.actor.classes.druid?.system.levels >= 10) ? 1 : 0
    }});
}
async function early({actor, config, dialog}) {
    dialog.configure = false;
    if (actor.classes.druid?.system.levels < 10) return;
    config.scaling = 1;
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['starryFormArcher', 'starryFormChalice', 'starryFormDragon'], 'wildShape');
    let subclassIdentifier = itemUtils.getConfig(item, 'subclassIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[subclassIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[subclassIdentifier]?.['die']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'die');
        return;
    }
    await itemUtils.fixScales(item);
}
export let starryForm = {
    name: 'Starry Form',
    version: '1.3.55',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['starryFormArcher', 'starryFormDragon', 'starryFormChalice']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['luminousArrow']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],
    ddbi: {
        removedItems: {
            'Starry Form': [
                'Starry Form: Archer',
                'Starry Form: Chalice',
                'Starry Form: Dragon'
            ]
        }
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'druid',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'subclassIdentifier',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            type: 'text',
            default: 'stars',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'starry-form',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'subclassIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'starry-form',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        2: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        10: {
                            number: 2,
                            faces: 8,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Starry Form'
            }
        }
    ]
};
export let starryFormActive = {
    name: 'Starry Form: Active',
    version: starryForm.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};