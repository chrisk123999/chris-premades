import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let classLevels = workflow.actor.classes.druid?.system.levels;
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
                }
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
                key: 'flags.midi-qol.min.ability.check.wis',
                value: 10,
                mode: 4,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.check.int',
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
                    value: genericUtils.handleMetric(20),
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
    let selection = await dialogUtils.buttonDialog(twinklingItem.name, 'CHRISPREMADES.Macros.StarryForm.Change', features.map((i,idx) => [i.name, idx + 1]).concat([['CHRISPREMADES.Generic.No', false]]));
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
    let spellLabel = actorUtils.getEquivalentSpellSlotName(actor, 1);
    if (spellLabel) config.spell = {slot: spellLabel};
}
export let starryForm = {
    name: 'Starry Form',
    version: '1.2.28',
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
    ddbi: {
        removedItems: {
            'Starry Form': [
                'Starry Form: Archer',
                'Starry Form: Chalice',
                'Starry Form: Dragon'
            ]
        }
    }
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