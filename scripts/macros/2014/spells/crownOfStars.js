import {activityUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.activity) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'attack', {strict: true});
    if (!activity) return;
    await genericUtils.update(activity, {
        uses: {
            max: (workflowUtils.getCastLevel(workflow) - 7) * 2 + 7,
            spent: 0
        }
    });
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    await effectUtils.createEffect(workflow.actor, effectData, {
        vae: [
            {type: 'use', name: activity.name, identifier: 'attack', activityIdentifier: 'attack'}
        ],
        concentrationItem: workflow.item,
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['attack'],
            favorite: true
        }
    });
}
async function attack({trigger, workflow}) {
    if (!workflow.activity || !workflow.item) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'crownOfStarsEffect');
    if (!effect) return;
    let uses = workflow.actor.items.get(workflow.item.id).system.activities.get(workflow.activity.id).uses.value; //Why is this needed?
    if (uses > 3) return;
    if (!uses) {
        await genericUtils.remove(effect);
        return;
    }
    if (Number(effect.changes[0].value) === 30) return;
    await genericUtils.update(effect, {
        changes: [
            {
                key: 'ATL.light.dim',
                value: 30,
                mode: 4
            }
        ]
    });
}
export let crownOfStars = {
    name: 'Crown of Stars',
    version: '1.3.43',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50,
                activities: ['attack']
            }
        ]
    }
};