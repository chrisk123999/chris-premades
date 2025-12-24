import {activityUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'formOfDreadFear', {strict: true});
    if (!feature) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    sourceEffect.duration = itemUtils.convertDuration(workflow.activity);
    await effectUtils.createEffect(workflow.actor, effectData, {
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
}
async function late({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (combatUtils.inCombat() && !combatUtils.isOwnTurn(workflow.token)) return;
    let origin = await effectUtils.getOriginItem(effect);
    if (!origin) return;
    let activity = activityUtils.getActivityByIdentifier(origin, 'formOfDreadFear');
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let selection = await dialogUtils.confirm(activity.name, 'CHRISPREMADES.Macros.FormOfDread.Use');
    if (!selection) return;
    let inCombat = combatUtils.inCombat();
    await workflowUtils.syntheticActivityRoll(activity, Array.from(workflow.hitTargets), {consumeResources: inCombat, consumeUsage: inCombat});
}
export let formOfDread = {
    name: 'Form of Dread',
    version: '1.4.4',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['formOfDread']
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
export let formOfDreadActive = {
    name: 'Form of Dread: Active',
    version: formOfDread.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};