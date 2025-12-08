import {activityUtils, animationUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
import {harkonsBite} from './harkonsBite.js';
async function bite({trigger: {entity: item}, workflow}) {
    if (!itemUtils.getEquipmentState(item)) return;
    if (!workflow.item) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'harkonsBite') return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier != 'humanoid') return;
    let activity = workflow.activity.clone({'save.dc.formula': workflow.activity.save.dc.formula + ' + ' + itemUtils.getConfig(item, 'biteBonus')}, {keepId: true});
    activity.prepareData();
    activity.prepareFinalData();
    workflow.activity = activity;
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!itemUtils.getEquipmentState(item)) return;
    if (!workflow.item) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'harkonsBite') return;
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (!['bite', 'claws'].includes(activityIdentifier)) return;
    await workflowUtils.bonusDamage(workflow, itemUtils.getConfig(item, 'formula'), {damageType: itemUtils.getConfig(item, 'damageType')});
}
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let claws = activityUtils.getActivityByIdentifier(workflow.item, 'claws', {strict: true});
    let human = activityUtils.getActivityByIdentifier(workflow.item, 'human', {strict: true});
    if (!claws || !human) return;
    let vae = [
        {
            type: 'use',
            name: claws.name,
            identifier: 'amuletOfTheLycanthrope',
            activityIdentifier: 'claws'
        },
        {
            type: 'use',
            name: human.name,
            identifier: 'amuletOfTheLycanthrope',
            activityIdentifier: 'human'
        }
    ];
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'amuletOfTheLycanthropeEffect');
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let animation = itemUtils.getConfig(workflow.item, 'hybridAnimation');
    let createEffectFunction = async function () {
        if (effect) await genericUtils.remove(effect);
        await effectUtils.createEffect(workflow.actor, effectData, {
            identifier: 'amuletOfTheLycanthropeEffect',
            vae,
            unhideActivities: [
                {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers: ['claws', 'human'],
                    favorite: true
                }
            ],
            rules: 'legacy',
            avatarImg: itemUtils.getConfig(workflow.item, 'hybridAvatarImg'),
            avatarImgPriority: itemUtils.getConfig(workflow.item, 'hybridAvatarImgPriority'),
            tokenImg: itemUtils.getConfig(workflow.item, 'hybridTokenImg'),
            tokenImgPriority: itemUtils.getConfig(workflow.item, 'hybridTokenImgPriority'),
            animate: !playAnimation
        });
    };
    if (playAnimation) {
        if (animation === 'moonFrenzy') {
            await harkonsBite.utilFunctions.moonFrenzy(workflow.token, {callback: createEffectFunction, tintMap: itemUtils.getConfig(workflow.item, 'tintMap'), color: itemUtils.getConfig(workflow.item, 'moonColor') ? 'red' : 'white'});
        } else {
            await harkonsBite.utilFunctions.shapeChange(workflow.token, {callback: createEffectFunction});
        }
    } else {
        await createEffectFunction();
    }
}
async function human({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'amuletOfTheLycanthropeEffect');
    if (effect) await genericUtils.remove(effect);
}
async function removed({trigger: {token}}) {
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Moon Frenzy', object: token});
}
async function keenHearingAndSmell({trigger: {skillId}}) {
    if (skillId != 'prc') return;
    return {
        label: genericUtils.translate('CHRISPREMADES.Macros.HarkonsBite.Keen'),
        type: 'advantage'
    };
}
export let amuletOfTheLycanthrope = {
    name: 'Amulet of the Lycanthrope',
    version: '1.3.163',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: human,
                priority: 50,
                activities: ['human']
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 60
            },
            {
                pass: 'preambleComplete',
                macro: bite,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d8',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'biteBonus',
            label: 'CHRISPREMADES.Macros.AmuletOfTheLycanthrope.BiteBonus',
            type: 'text',
            default: '3',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'hybridAnimation',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAnimation',
            type: 'select',
            default: 'moonFrenzy',
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
            value: 'hybridTokenImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridTokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'hybridTokenImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridTokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'hybridAvatarImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'hybridAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};
export let amuletOfTheLycanthropeEffect = {
    name: 'Amulet of the Lycanthrope: Bestial Form',
    version: amuletOfTheLycanthrope.version,
    rules: amuletOfTheLycanthrope.rules,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'context',
            macro: keenHearingAndSmell,
            priority: 50
        }
    ]
};