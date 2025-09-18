import {activityUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function attacked({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.token) return;
    if (!constants.attacks.includes(workflowUtils.getActionType(workflow))) return;
    if (!effect.origin) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'save', {strict: true});
    if (!activity?.uses?.value) return;
    let result = await workflowUtils.syntheticActivityRoll(activity, [workflow.token], {consumeResources: true});
    if (!result.failedSaves.size) return;
    workflow.keepActivityCard = true;
    workflow.aborted = true;
}
async function use({trigger, workflow}) {
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = workflow.item.uuid;
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'unbreakableMajestyEffect',
        rules: 'modern',
        macros: [{type: 'midi.actor', macros: ['unbreakableMajestyEffect']}],
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
export let unbreakableMajesty = {
    name: 'Unbreakable Majesty',
    version: '1.1.41',
    rules: 'modern',
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
export let unbreakableMajestyEffect = {
    name: unbreakableMajesty.name,
    version: unbreakableMajesty.version,
    rules: unbreakableMajesty.rules,
    midi: {
        actor: [
            {
                pass: 'targetAttackRollComplete',
                macro: attacked,
                priority: 50
            }
        ]
    }
};