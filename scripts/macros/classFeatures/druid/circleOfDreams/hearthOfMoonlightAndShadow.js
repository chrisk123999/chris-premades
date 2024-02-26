import {chris} from '../../../../helperFunctions.js';
async function item() {
    await warpgate.wait(50);
    let effect = chrisPremades.helpers.findEffect(workflow.actor, workflow.item.name + ' Template');
    if (!effect) return;
    await effect.setFlag('dae', 'specialDuration', [
        'shortRest',
        'longRest'
    ]);
}
async function left(template, token) {
    let originActor = await fromUuid(template.flags['midi-qol'].actorUuid);
    if (token.actor != originActor) return;
    let originItem = await fromUuid(template.flags['midi-qol'].itemUuid);
    let effect = chris.findEffect(token.actor, originItem.name + ' Template');
    if (effect) await chris.removeEffect(effect);
}
export let hearthOfMoonlightAndShadow = {
    'item': item,
    'left' : left,
}
