import {chris} from '../../../../helperFunctions.js';
export async function insightfulFighting({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    if (chris.findEffect(targetToken.actor, 'Incapacitated')) return;
    let sourceRoll = await workflow.actor.rollSkill('ins');
    let targetRoll = await chris.rollRequest(targetToken, 'skill', 'dec');
    if (targetRoll.total >= sourceRoll.total) return;
    let effectData = {
        'label': 'Insightful Fighting',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'flags.chris-premades.feature.insightfulFightning.target',
                'mode': 5,
                'value': targetToken.document.uuid,
                'priority': 20
            }
        ]
    }
    let effect = chris.findEffect(workflow.actor, 'Insightful Fighting');
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(workflow.actor, effectData);
}