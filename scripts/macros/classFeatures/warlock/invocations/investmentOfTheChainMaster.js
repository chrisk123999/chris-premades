import {chris} from '../../../../helperFunctions.js';
async function reaction({speaker, actor, token, character, item, args, scope, workflow}) {
    let reactionEffect = chris.findEffect(workflow.actor, 'Reaction');
    if (reactionEffect) await chris.removeEffect(reactionEffect);
    let effect = chris.findEffect(workflow.actor, 'Summoned Creature');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    await chris.addCondition(origin.actor, 'Reaction');
    await workflow.item.update({'system.uses.max': 1});
}
async function turnStart(effect) {
    let familiarId = effect.flags['chris-premades']?.summons?.ids[effect.label][0];
    if (!familiarId) return;
    let familiarToken = canvas.scene.tokens.get(familiarId);
    if (!familiarToken) return;
    let targetItem = familiarToken.actor.items.find(i => i.name === 'Investment of the Chain Master - Familiar Resistance');
    if (!targetItem) return;
    await targetItem.update({'system.uses.max': 0});
}
export let investmentOfTheChainMaster = {
    'reaction': reaction,
    'turnStart': turnStart
}