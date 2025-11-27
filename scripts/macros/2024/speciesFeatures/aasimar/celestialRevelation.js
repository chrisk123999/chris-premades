import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (!identifier) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    let avatarImg = itemUtils.getConfig(workflow.item, identifier + 'Avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, identifier + 'Token');
    let avatarImgPriority = itemUtils.getConfig(workflow.item, 'avatarPriority');
    let tokenImgPriority = itemUtils.getConfig(workflow.item, 'avatarPriority');
    await effectUtils.createEffect(workflow.actor, effectData, {
        rules: 'modern',
        avatarImg,
        avatarImgPriority,
        tokenImg,
        tokenImgPriority
    });
}
async function turnEnd({trigger: {entity: effect}}) {
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let activity = activityUtils.getActivityByIdentifier(originItem, 'innerRadianceDamage', {strict: true});
    if (!activity) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    let nearby = tokenUtils.findNearby(token, 10, 'enemy', {includeIncapacitated: true});
    if (!nearby.length) return;
    await workflowUtils.syntheticActivityRoll(activity, nearby);
}
export let celestialRevelation = {
    name: 'Celestial Revelation',
    version: '1.3.146',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['heavenlyWings', 'innerRadiance', 'necroticShroud']
            }
        ]
    },
    config: [
        {
            value: 'heavenlyWingsAvatar',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.HeavenlyWingsAvatar',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'heavenlyWingsToken',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.HeavenlyWingsToken',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'innerRadianceAvatar',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.InnerRadianceAvatar',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'innerRadianceToken',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.InnerRadianceToken',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'necroticShroudAvatar',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.NecroticShroudAvatar',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'necroticShroudToken',
            label: 'CHRISPREMADES.Macros.CelestialRevelation.NecroticShroudToken',
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
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ]
};
export let celestialRevelationInnerRadiance = {
    name: 'Celestial Revelation: Inner Radiance',
    version: celestialRevelation.version,
    rules: celestialRevelation.rules,
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};