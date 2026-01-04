import {activityUtils, actorUtils, animationUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
import {harkonsBite} from '../../../items/trinket/harkonsBite.js';
import {dash} from '../../../actions/dash.js';
import {hide} from '../../../actions/hide.js';
async function use({trigger, workflow}) {
    let identifiers = ['bite', 'claw'];
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let levels = workflow.actor.classes[classIdentifier]?.system?.levels;
    if (levels >= 5) identifiers.push(...['dash', 'hide']);
    let activities = identifiers.map(identifier => activityUtils.getActivityByIdentifier(workflow.item, identifier, {strict: true})).filter(i => i);
    if (activities.length < 2) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    if (levels >= 6) {
        effectData.duration = {seconds: 3600};
    } else {
        effectData.duration = itemUtils.convertDuration(workflow.activity);
    }
    let vae = activities.map(activity => ({
        type: 'use',
        name: activity.name,
        identifier: 'formOfTheBeastWarlock',
        activityIdentifier: activityUtils.getIdentifier(activity)
    }));
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let animation = itemUtils.getConfig(workflow.item, 'transformAnimation');
    let createEffectFunction = async function () {
        let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'formOfTheBeastWarlockEffect');
        if (effect) await genericUtils.remove(effect);
        await effectUtils.createEffect(workflow.actor, effectData, {
            vae,
            unhideActivities: [
                {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers: identifiers,
                    favorite: true
                }
            ],
            avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
            tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
            avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
            tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority'),
            animate: !playAnimation
        });
    };
    if (playAnimation) {
        if (animation === 'moonFrenzy') {
            await harkonsBite.utilFunctions.moonFrenzy(workflow.token, {callback: createEffectFunction, tintMap: itemUtils.getConfig(workflow.item, 'tintMap'), color: itemUtils.getConfig(workflow.item, 'moonColor') ? 'red' : 'white', name: 'Moon Frenzy: formOfTheBeast'});
        } else {
            await harkonsBite.utilFunctions.shapeChange(workflow.token, {callback: createEffectFunction});
        }
    } else {
        await createEffectFunction();
    }
}
async function supernaturallyKeen({trigger: {skillId}}) {
    if (!['prc', 'ste', 'sur'].includes(skillId)) return;
    return {
        label: genericUtils.translate('CHRISPREMADES.Macros.FormOfTheBeast.Keen'),
        type: 'advantage'
    };
}
async function removed({trigger: {token}}) {
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Moon Frenzy: formOfTheBeast', object: token});
}
async function attack({trigger, workflow}) {
    let defaultType = workflow.activity.attack.ability;
    if (!defaultType) defaultType = 'str';
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    let bestAbility = actorUtils.getBestAbility(workflow.actor, [defaultType, 'cha']);
    if (bestAbility === defaultType) return;
    itemData.system.activities[workflow.activity.id].attack.ability = bestAbility;
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function naturalAttack({trigger, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    let isNatural = workflow.item.system.type?.value === 'natural';
    if (!isNatural) {
        let itemIdentifier = genericUtils.getIdentifier(workflow.item);
        let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
        let validItems = ['harkonsBite'];
        let validActivities = ['bite', 'claws'];
        if (validItems.includes(itemIdentifier) && validActivities.includes(activityIdentifier)) isNatural = true;
    }
    if (!isNatural) return;
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    if (workflow.item.type === 'weapon') {
        itemData.system.damage.base.denomination = Math.min(itemData.system.damage.base.denomination + 2, 12);
    } else {
        itemData.system.activities[workflow.activity.id].damage.parts[0].denomination = Math.min(itemData.system.activities[workflow.activity.id].damage.parts[0].denomination + 2, 12);
    }
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let formOfTheBeastWarlock = {
    name: 'Form of the Beast',
    version: '1.4.12',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['transform']
            },
            {
                pass: 'rollFinished',
                macro: dash.midi.item[0].macro,
                priority: 50,
                activities: ['dash']
            },
            {
                pass: 'rollFinished',
                macro: hide.midi.item[0].macro,
                priority: 50,
                activities: ['hide']
            },
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 25,
                activities: ['bite', 'claw']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'transformAnimation',
            label: 'CHRISPREMADES.Config.TransformAnimation',
            type: 'select',
            default: 'shapechange',
            category: 'animation',
            options: [
                {
                    value: 'moonFrenzy',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.MoonFrenzy'
                },
                {
                    value: 'shapechange',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.Shapechange'
                }
            ]
        },
        {
            value: 'tintMap',
            label: 'CHRISPREMADES.Config.TintMap',
            type: 'checkbox',
            default: false,
            category: 'animation'
        },
        {
            value: 'moonColor',
            label: 'CHRISPREMADES.Macros.HarkonsBite.MoonColor',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'tokenImg',
            label: 'CHRISPREMADES.Config.TokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'avatarImg',
            label: 'CHRISPREMADES.Config.AvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'avatarImgPriority',
            label: 'CHRISPREMADES.Config.AvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.DashAnimation',
            type: 'select',
            default: 'cunningAction',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'warlock',
            category: 'homebrew',
            homebrew: true
        }
    ],
    hasAnimation: true,
    ddbi: {
        restrictedItems: {
            'Form of the Beast': {
                originalName: 'Form of the Beast',
                requiredClass: 'Warlock'
            }
        }
    }
};
export let formOfTheBeastWarlockEffect = {
    name: 'Form of the Beast: Transformed',
    version: formOfTheBeastWarlock.version,
    rules: formOfTheBeastWarlock.rules,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: naturalAttack,
                priority: 30
            }
        ]
    },
    skill: [
        {
            pass: 'context',
            macro: supernaturallyKeen,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};