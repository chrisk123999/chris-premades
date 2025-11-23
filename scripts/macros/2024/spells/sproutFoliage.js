import {activityUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let attack = activityUtils.getActivityByIdentifier(workflow.item, 'attack', {strict: true});
    if (!attack) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'sproutFoliageEffect');
    if (effect) await genericUtils.remove(effect);
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'sproutFoliageEffect',
        vae: [
            {
                type: 'use',
                name: attack.name,
                identifier: 'sproutFoliage',
                activityIdentifier: 'attack'
            }
        ],
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['attack'],
                favorite: true
            }
        ],
        rules: genericUtils.getRules(workflow.item),
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
export let sproutFoliage = {
    name: 'Sprout Foliage',
    version: '1.3.114',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: 'use'
            }
        ]
    },
    config: [
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
        }
    ]
};