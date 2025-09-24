import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = workflow.item.uuid;
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'infernalMajestyEffect',
        rules: 'legacy',
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
async function death({trigger: {entity: effect, token}}) {
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let selection = await dialogUtils.confirmUseItem(item, {userId: socketUtils.firstOwner(effect, true)});
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'death', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, []);
    if (token) await genericUtils.update(token.document, {'hidden': true});
}
export let infernalMajesty = {
    name: 'Infernal Majesty',
    version: '1.3.70',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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
export let infernalMajestyEffect = {
    name: 'Infernal Majesty: Effect',
    version: infernalMajesty.version,
    rules: infernalMajesty.rules,
    death: [
        {
            pass: 'dead',
            macro: death,
            priority: 50
        }
    ]
};