import {chris} from '../../../helperFunctions.js';
export async function lifeEater({speaker, actor, token, character, item, args, scope, workflow}) {
    let displayFeature = false;
    for (let i of workflow.damageList) {
        if (i.oldHP === 0 || i.newHP > 0) continue;
        let targetToken = await fromUuid(i.tokenUuid);
        if (!targetToken) continue;
        let effect = chris.findEffect(targetToken.actor, 'Unconscious');
        if (!effect) continue;
        await chris.removeEffect(effect);
        await chris.addCondition(targetToken.actor, 'Dead', true);
        displayFeature = true;
    }
    if (!displayFeature) return;
    let effect = chris.findEffect(workflow.actor, 'Life Eater');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = effect.parent;
    if (!originItem) return;
    await originItem.displayCard();
}