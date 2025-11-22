import {effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'transform');
    let {avatarImg, avatarImgPriority, tokenImg, tokenImgPriority, items} = {};
    if ((config?.profileOneActivities?.length && config?.profileOneActivities.includes(workflow.activity.id)) || (!config?.profileOneActivities?.length && !config?.profileTwoActivities?.length)) {
        avatarImg = config?.profileOneAvatarImg;
        avatarImgPriority = config?.profileOneAvatarImgPriority;
        tokenImg = config?.profileOneTokenImg;
        tokenImgPriority = config?.profileOneTokenImgPriority;
        items = config?.profileOneItems;
    } else if (config?.profileTwoActivities?.length && config?.profileTwoActivities.includes(workflow.activity.id)) {
        avatarImg = config?.profileTwoAvatarImg;
        avatarImgPriority = config?.profileTwoAvatarImgPriority;
        tokenImg = config?.profileTwoTokenImg;
        tokenImgPriority = config?.profileTwoTokenImgPriority;
        items = config?.profileTwoItems;
    } else return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        avatarImg,
        avatarImgPriority,
        tokenImg,
        tokenImgPriority
    });
    if (!effect) return;
    let itemData = (await Promise.all(items.map(async i => {
        let item = await fromUuid(i);
        if (!item) return null;
        let itemData = genericUtils.duplicate(item.toObject());
        delete itemData._id;
        return itemData;
    }))).filter(i => i);
    await itemUtils.createItems(workflow.actor, itemData, {favorite: true, parentEntity: effect});
}
export let transform = {
    name: 'Transform',
    translation: 'CHRISPREMADES.Macros.Transform.Name',
    version: '1.3.138',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'profileOneActivities',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneActivities',
            type: 'activities',
            default: []
        },
        {
            value: 'profileOneItems',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneItems',
            type: 'documents',
            default: []
        },
        {
            value: 'profileOneTokenImg',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneTokenImg',
            type: 'file',
            default: ''
        },
        {
            value: 'profileOneTokenImgPriority',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneTokenImgPriority',
            type: 'number',
            default: 50
        },
        {
            value: 'profileOneAvatarImg',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneAvatarImg',
            type: 'file',
            default: ''
        },
        {
            value: 'profileOneAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.Transform.ProfileOneAvatarImgPriority',
            type: 'number',
            default: 50
        },
        {
            value: 'profileTwoActivities',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoActivities',
            type: 'activities',
            default: []
        },
        {
            value: 'profileTwoItems',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoItems',
            type: 'documents',
            default: []
        },
        {
            value: 'profileTwoTokenImg',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoTokenImg',
            type: 'file',
            default: ''
        },
        {
            value: 'profileTwoTokenImgPriority',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoTokenImgPriority',
            type: 'number',
            default: 50
        },
        {
            value: 'profileTwoAvatarImg',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoAvatarImg',
            type: 'file',
            default: ''
        },
        {
            value: 'profileTwoAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.Transform.ProfileTwoAvatarImgPriority',
            type: 'number',
            default: 50
        }
    ]
};