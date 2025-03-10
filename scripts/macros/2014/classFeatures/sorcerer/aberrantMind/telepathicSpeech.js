import {effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let actorSourceEffect = workflow.item.effects.contents?.[0];
    let targetSourceEffect = workflow.item.effects.contents?.[1];
    if (!actorSourceEffect || !targetSourceEffect) return;
    let actorEffectData = genericUtils.duplicate(actorSourceEffect.toObject());
    actorEffectData.duration = itemUtils.convertDuration(workflow.activity);
    let targetEffectData = genericUtils.duplicate(targetSourceEffect.toObject());
    targetEffectData.duration = itemUtils.convertDuration(workflow.activity);
    let effect = await effectUtils.createEffect(workflow.actor, actorEffectData);
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, targetEffectData, {parentEntity: effect});
    }));
}
export let telepathicSpeech = {
    name: 'Telepathic Speech',
    version: '1.2.17',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};