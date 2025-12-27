import {activityUtils, effectUtils, genericUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'orbOfDamaraEffect');
    if (effect) {
        await genericUtils.remove(effect);
        return;
    }
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function turnStart({trigger: {entity: effect, token, target}}) {
    let immuneEffect = effectUtils.getEffectByIdentifier(target.actor, 'orbOfDamaraImmune');
    if (immuneEffect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin?.parent) return;
    let activity = activityUtils.getActivityByIdentifier(origin.parent, 'fear', {strict: true});
    if (!activity) return;
    let workflow = await workflowUtils.syntheticActivityRoll(activity, [target]);
    if (workflow.failedSaves.size) return;
    let sourceEffect = workflow.activity.effects[1]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = {
        seconds: 86400
    };
    await effectUtils.createEffect(target.actor, effectData);
}
export let orbOfDamara = {
    name: 'Orb of Damara',
    version: '1.4.2',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['aura']
            }
        ]
    }
};
export let orbOfDamaraEffect = {
    name: 'Orb of Damara: Effect',
    version: orbOfDamara.version,
    rules: 'modern',
    combat: [
        {
            pass: 'turnStartNear',
            priority: 50,
            macro: turnStart,
            distance: 20,
            isposition: 'enemy'
        }
    ]
};