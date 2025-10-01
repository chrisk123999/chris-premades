import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'cosmicOmenWoe') ?? effectUtils.getEffectByIdentifier(workflow.actor, 'cosmicOmenWeal');
    if (effect) await genericUtils.remove(effect);
    let isOdd = workflow.utilityRoll.total % 2;
    let activityIdentifier = isOdd ? 'cosmicOmenWoe' : 'cosmicOmenWeal';
    let activity = activityUtils.getActivityByIdentifier(workflow.item, activityIdentifier, {strict: true});
    if (!activity) return;
    let effectData = {
        name: activity.name,
        img: activity.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                rules: 'modern'
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['cosmicOmenActive']);
    effectUtils.addMacro(effectData, 'check', ['cosmicOmenActive']);
    effectUtils.addMacro(effectData, 'save', ['cosmicOmenActive']);
    effectUtils.addMacro(effectData, 'skill', ['cosmicOmenActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: activityIdentifier,
        unhideActivities: [{
            itemUuid: workflow.item.uuid,
            activityIdentifiers: [activityIdentifier],
            favorite: true
        }]
    });
}
async function manual({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (workflow.workflowOptions['chris-premades']?.notManual) return;
    let bonus = workflow.utilityRoll.total;
    let changesKeys = [
        'system.bonuses.mwak.attack',
        'system.bonuses.msak.attack',
        'system.bonuses.rwak.attack',
        'system.bonuses.rsak.attack',
        'system.bonuses.abilities.check',
        'system.bonuses.abilities.save',
        'system.attributes.init.bonus'
    ];
    let effectData = {
        name: workflow.activity.name,
        img: workflow.activity.img,
        duration: {
            seconds: 1
        },
        flags: {
            dae: {
                specialDuration: ['1Attack', 'isSave', 'isCheck', 'isInitiative']
            }
        },
        changes: changesKeys.map(i => ({
            key: i,
            mode: 2,
            value: bonus,
            priority: 20
        }))
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function getWealWoeBonus(effect, item, token, targetToken) {
    let isWeal = genericUtils.getIdentifier(effect) === 'cosmicOmenWeal';
    let content = genericUtils.format('CHRISPREMADES.Macros.CosmicOmen.' + (isWeal ? 'Weal' : 'Woe'), {itemName: effect.name, tokenName: targetToken.name});
    let selection = await dialogUtils.confirm(effect.name, content, {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(item, isWeal ? 'cosmicOmenWeal' : 'cosmicOmenWoe', {strict: true});
    let newWorkflow = await workflowUtils.syntheticActivityRoll(activity, [targetToken], {
        options: {
            workflowOptions: {
                'chris-premades': {
                    notManual: true
                }
            }
        },
        dialog: {
            create: false
        },
        consumeResources: true
    });
    return newWorkflow.utilityRoll.total;
}
async function attack({trigger: {entity: effect, token}, workflow}) {
    let item = await effectUtils.getOriginItem(effect);
    if (!item || !itemUtils.getConfig(item, 'enablePrompt')) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (tokenUtils.getDistance(token, workflow.token) > 30) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    let bonus = await getWealWoeBonus(effect, item, token, workflow.token);
    if (!bonus) return;
    await workflowUtils.bonusAttack(workflow, String(bonus));
}
async function check({trigger: {sourceActor, roll, entity: effect}}) {
    let item = await effectUtils.getOriginItem(effect);
    if (!item || !itemUtils.getConfig(item, 'enablePrompt')) return;
    if (actorUtils.hasUsedReaction(item.parent)) return;
    let token = actorUtils.getFirstToken(sourceActor);
    let druidToken = actorUtils.getFirstToken(item.parent);
    if (!token || !druidToken) return;
    if (tokenUtils.getDistance(druidToken, token) > 30) return;
    if (!tokenUtils.canSee(druidToken, token)) return;
    let bonus = await getWealWoeBonus(effect, item, druidToken, token);
    if (!bonus) return;
    return await rollUtils.addToRoll(roll, String(bonus), {rollData: roll.data});
}
export let cosmicOmen = {
    name: 'Cosmic Omen',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['cosmicOmen']
            },
            {
                pass: 'rollFinished',
                macro: manual,
                priority: 50,
                activities: ['cosmicOmenWeal', 'cosmicOmenWoe']
            }
        ]
    },
    config: [
        {
            value: 'enablePrompt',
            label: 'CHRISPREMADES.Config.EnablePrompt',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};
export let cosmicOmenActive = {
    name: 'Cosmic Omen: Active',
    version: cosmicOmen.version,
    rules: cosmicOmen.rules,
    midi: {
        actor: [
            {
                pass: 'scenePostAttackRoll',
                macro: attack,
                priority: 50
            }
        ]
    },
    check: [
        {
            pass: 'sceneBonus',
            macro: check,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'sceneBonus',
            macro: check,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'sceneBonus',
            macro: check,
            priority: 50
        }
    ]
};