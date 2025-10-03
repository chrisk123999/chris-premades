import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function saveCheckSkill({trigger: {config, roll, entity: effect}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    let formula = effect.flags['chris-premades']?.bardicInspiration?.formula;
    if (!formula) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name + ' (' + formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    await genericUtils.remove(effect);
    return await rollUtils.addToRoll(roll, formula);
}
async function attack({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size|| workflow.isFumble) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let formula = effect.flags['chris-premades']?.bardicInspiration?.formula;
    if (!formula) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: effect.name + ' (' + formula + ')', attackTotal: workflow.attackTotal}));
    if (!selection) return;
    await genericUtils.remove(effect);
    await workflowUtils.bonusAttack(workflow, formula);
}
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier') ?? 'inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let combatInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'combatInspiration');
    if (combatInspiration) {
        let combatInspirationEffect = combatInspiration.effects.contents?.[0];
        if (combatInspirationEffect) {
            let combatInspirationEffectData = genericUtils.duplicate(combatInspirationEffect.toObject());
            combatInspirationEffectData.changes[0].value = combatInspiration.name;
            combatInspirationEffectData.changes.forEach(i => {
                if (i.key === 'flags.midi-qol.optional.combatinspiration.label') {
                    i.value = combatInspiration.name;
                } else if (i.key != 'flags.midi-qol.optional.combatinspiration.count') {
                    i.value = scale.formula;
                }
            });
            effectData.changes.push(...combatInspirationEffectData.changes);
        }
        await combatInspiration.displayCard();
    }
    genericUtils.setProperty(effectData, 'flags.chris-premades.bardicInspiration.formula', scale.formula);
    await Promise.all(workflow.targets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
    let dazzlingFootwork = itemUtils.getItemByIdentifier(workflow.actor, 'dazzlingFootwork');
    if (dazzlingFootwork && workflow.token && !actorUtils.getEquippedArmor(workflow.actor) && !actorUtils.getEquippedShield(workflow.actor)) {
        let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
        if (unarmedStrike) {
            let nearbyTargets = tokenUtils.findNearby(workflow.token, unarmedStrike.system.range.reach, 'enemy', {includeIncapacitated: true});
            if (nearbyTargets.length) {
                let selection = await dialogUtils.selectTargetDialog(dazzlingFootwork.name, 'CHRISPREMADES.Macros.DazzlingFootwork.AgileStrikes', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
                if (selection?.[0]) {
                    let activity = activityUtils.getActivityByIdentifier(unarmedStrike, 'punch', {strict: true});
                    if (activity) {
                        let itemData = genericUtils.duplicate(unarmedStrike.toObject());
                        itemData.system.activities[activity.id].activation.type = 'special';
                        await workflowUtils.syntheticItemRoll(dazzlingFootwork, [workflow.token]);
                        await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [selection[0]]);
                    }
                }
            }
        }
    }
}
async function added({trigger: {entity: item}}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[classIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[classIdentifier]?.['inspiration']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'inspiration');
        return;
    }
    await itemUtils.fixScales(item);
}
export let bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '1.3.57',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'bardic-inspiration',
                    type: 'dice',
                    scale: {
                        1: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        10: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        },
                        15: {
                            number: 1,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Bardic Inspiration',
                icon: null
            }
        }
    ]
};
export let bardicInspirationEffect = {
    name: bardicInspiration.name,
    version: bardicInspiration.version,
    rules: bardicInspiration.rules,
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 100
            }
        ]
    },
    save: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ]
};