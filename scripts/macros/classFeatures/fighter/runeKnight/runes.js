import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function lateFireRune({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'fireRune');
    if (!originItem) return;
    if (!originItem.system.uses.value) return;
    if (!itemUtils.getConfig(originItem, 'allowUnarmed') && constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (actorUtils.hasUsedReaction(workflow.actor)) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(originItem, [workflow.targets.first()], {config: {consumeUsage: true}});
}
async function turnEndStoneRune({trigger: {entity: item, token, target}}) {
    if (!item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [target], {config: {consumeUsage: true}});
}
async function earlyStoneRune({workflow}) {
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionImmunity'),
        img: 'icons/magic/time/arrows-circling-green.webp',
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
        duration: {
            seconds: 60
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['stormRune']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'stormRune'});
}
async function earlyStormRune({trigger: {entity: effect, token}, workflow}) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (tokenUtils.getDistance(token, workflow.token) > 60) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let selection = await dialogUtils.buttonDialog(effect.name, genericUtils.format('CHRISPREMADES.Macros.StormRune.AdvDis', {tokenName: workflow.token.name, actionType: genericUtils.translate('DND5E.AttackRoll')}), [
        ['DND5E.Advantage', 'advantage'],
        ['DND5E.Disadvantage', 'disadvantage'],
        ['DND5E.None', false]
    ]);
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
export let fireRune = {
    name: 'Fire Rune',
    version: '0.12.52',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateFireRune,
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
    version: '0.12.52',
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
    version: '0.12.52',
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
    version: '0.12.52',
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
    version: '0.12.52',
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