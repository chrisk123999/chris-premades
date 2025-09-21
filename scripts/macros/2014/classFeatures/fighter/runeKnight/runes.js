import {actorUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function damageFireRune({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!item.system.uses.value) return;
    if (!itemUtils.getConfig(item, 'allowUnarmed') && constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (actorUtils.hasUsedReaction(workflow.actor)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.bonusDamage(workflow, '2d6[fire]', {damageType: 'fire'});
    await workflowUtils.syntheticItemRoll(item, [workflow.targets.first()], {consumeResources: true});
}
async function turnEndStoneRune({trigger: {entity: item, token, target}}) {
    if (!item.system.uses.value) return;
    if (!target.actor.system.attributes.hp.value) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)});
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [target], {consumeResources: true});
}
async function earlyStoneRune({workflow}) {
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionImmunity'),
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 99,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let targetActor = workflow.targets.first()?.actor;
    if (!targetActor) return;
    if (actorUtils.checkTrait(targetActor, 'ci', 'charmed')) await effectUtils.createEffect(targetActor, effectData);
}
async function useStormRune({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['stormRune']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'stormRune'});
}
async function earlyStormRune({trigger: {entity: effect, token}, workflow}) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (tokenUtils.getDistance(token, workflow.token) > genericUtils.handleMetric(60)) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let selection = await dialogUtils.buttonDialog(effect.name, genericUtils.format('CHRISPREMADES.Macros.StormRune.AdvDis', {tokenName: workflow.token.name, actionType: genericUtils.translate('DND5E.AttackRoll')}), [
        ['DND5E.Advantage', 'advantage'],
        ['DND5E.Disadvantage', 'disadvantage'],
        ['DND5E.None', false]
    ], {userId: socketUtils.firstOwner(token, true)});
    if (!selection) return;
    if (selection === 'advantage') {
        workflow.advantage = true;
        workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
    } else {
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + effect.name);
    }
    await actorUtils.setReactionUsed(token.actor);
}
async function cloudRuneAttack({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.item) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let target = workflow.targets.first();
    let nearbyRunes = tokenUtils.findNearby(target, 30, 'ally', {includeToken: true}).filter(i => {
        let item = itemUtils.getItemByIdentifier(i.actor, 'cloudRune');
        if (!item) return;
        if (!item.system.uses.value) return;
        if (combatUtils.inCombat() && actorUtils.hasUsedReaction(i.actor)) return;
        let validTargets = tokenUtils.findNearby(i, 30, 'all', {includeIncapacitated: true, includeToken: true}).filter(j => j.document.uuid !== workflow.token.document.uuid && j.document.uuid !== target.document.uuid);
        if (!validTargets.length) return false;
        return true;
    });
    if (!nearbyRunes.length) return;
    for (let i of nearbyRunes) {
        let item = itemUtils.getItemByIdentifier(i.actor, 'cloudRune');
        let userId = socketUtils.firstOwner(i.document, true);
        let newTargets = tokenUtils.findNearby(i, 30, 'all', {includeIncapacitated: true, includeToken: true}).filter(j => j.document.uuid !== workflow.token.document.uuid && j.document.uuid != target.document.uuid);
        let newTarget = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.CloudRune.Reaction', {item: item.name, name: target.name}), newTargets, {userId: userId, skipDeadAndUnconscious: false, buttons: 'yesNo'});
        if (!newTarget) continue;
        newTarget = newTarget[0];
        workflow.aborted = true;
        let itemData = genericUtils.duplicate(workflow.item.toObject());
        delete itemData._id;
        itemData.system.range = {
            value: null,
            long: null,
            units: ''
        };
        await workflowUtils.syntheticItemRoll(item, [target], {consumeResources: true});
        genericUtils.setProperty(itemData, 'flags.chris-premades.setAttackRoll', {rollJSON: workflow.attackRoll.toJSON()});
        let macros = workflow.item.flags['chris-premades']?.macros?.midi?.item ?? [];
        macros.push('setAttackRoll');
        genericUtils.setProperty(itemData, 'flags.chris-premades.macros.midi.item', macros);
        let newActivity = itemData.system.activities[workflow.activity.id];
        newActivity.range.value = null;
        newActivity.range.override = true;
        if (newActivity.reach) newActivity.reach = null;
        await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [newTarget]);
        break;
    }
}
export let cloudRune = {
    name: 'Cloud Rune',
    version: '1.3.10',
    midi: {
        actor: [
            {
                pass: 'sceneAttackRollComplete',
                macro: cloudRuneAttack,
                priority: 150
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Cloud Rune': [
                'Rune Carver: Cloud Rune'
            ]
        }
    }
};
export let fireRune = {
    name: 'Fire Rune',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damageFireRune,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'allowUnarmed',
            label: 'CHRISPREMADES.Macros.FireRune.AllowUnarmed',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        removedItems: {
            'Fire Rune': [
                'Rune Carver: Fire Rune'
            ]
        }
    }
};
export let frostRune = {
    name: 'Frost Rune',
    version: '1.1.0',
    ddbi: {
        removedItems: {
            'Frost Rune': [
                'Rune Carver: Frost Rune'
            ]
        }
    }
};
export let stoneRune = {
    name: 'Stone Rune',
    version: '1.3.10',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: earlyStoneRune,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEndStoneRune,
            priority: 50,
            distance: 30,
            disposition: 'enemy'
        }
    ],
    ddbi: {
        removedItems: {
            'Stone Rune': [
                'Rune Carver: Stone Rune'
            ]
        }
    }
};
export let hillRune = {
    name: 'Hill Rune',
    version: '1.1.0',
    ddbi: {
        removedItems: {
            'Hill Rune': [
                'Rune Carver: Hill Rune'
            ]
        }
    }
};
// TODO: once save/check patching more complete, handle adv/dis for that
export let stormRune = {
    name: 'Storm Rune',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useStormRune,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: earlyStormRune,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: earlyStormRune,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Storm Rune': [
                'Rune Carver: Storm Rune'
            ]
        }
    }
};