import {activityUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function bat({trigger, workflow}) {
    let batEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireBatEffect');
    if (batEffect) return;
    let mistEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireMistEffect');
    if (mistEffect) await genericUtils.remove(mistEffect);
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    let revertActivity = activityUtils.getActivityByIdentifier(workflow.item, 'revert', {strict: true});
    if (!revertActivity) return;
    await effectUtils.createEffect(workflow.actor, effectData, {
        vae: [
            {
                type: 'use',
                name: revertActivity.name,
                identifier: 'vampireShapeShift',
                activityIdentifier: 'revert'
            }
        ],
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['revert'],
                favorite: true
            }
        ],
        avatarImg: itemUtils.getConfig(workflow.item, 'batAvatarImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'batAvatarImgPriority'),
        tokenImg: itemUtils.getConfig(workflow.item, 'batTokenImg'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'batTokenImgPriority')
    });
}
async function mist({trigger, workflow}) {
    let mistEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireMistEffect');
    if (mistEffect) return;
    let batEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireBatEffect');
    if (batEffect) await genericUtils.remove(batEffect);
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    let revertActivity = activityUtils.getActivityByIdentifier(workflow.item, 'revert', {strict: true});
    if (!revertActivity) return;
    await effectUtils.createEffect(workflow.actor, effectData, {
        vae: [
            {
                type: 'use',
                name: revertActivity.name,
                identifier: 'vampireShapeShift',
                activityIdentifier: 'revert'
            }
        ],
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['revert'],
                favorite: true
            }
        ],
        avatarImg: itemUtils.getConfig(workflow.item, 'mistAvatarImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'mistAvatarImgPriority'),
        tokenImg: itemUtils.getConfig(workflow.item, 'mistTokenImg'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'mistTokenImgPriority')
    });
}
async function revert({trigger, workflow}) {
    let batEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireBatEffect');
    if (batEffect) await genericUtils.remove(batEffect);
    let mistEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'vampireMistEffect');
    if (mistEffect) await genericUtils.remove(mistEffect);
}
export let vampireShapeShift = {
    name: 'Shape-Shift',
    monsters: [
        'Vampire'
    ],
    version: '1.3.126',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: bat,
                priority: 50,
                activities: ['bat']
            },
            {
                pass: 'rollFinished',
                macro: mist,
                priority: 50,
                activities: ['mist']
            },
            {
                pass: 'rollFinished',
                macro: bat,
                priority: 50,
                activities: ['revert']
            }
        ]
    },
    config: [
        {
            value: 'batTokenImg',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.BatTokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'batTokenImgPriority',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.BatTokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'batAvatarImg',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.BatAvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'batAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.BatAvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'mistTokenImg',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.MistTokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'mistTokenImgPriority',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.MistTokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'mistAvatarImg',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.MistAvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'mistAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.VampireShapeShift.MistAvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};