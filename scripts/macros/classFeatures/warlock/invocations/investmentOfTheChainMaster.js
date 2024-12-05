import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../../utils.js';
async function hit({trigger: {entity: item, token}, workflow}) {
    if (!workflow.hitTargets.has(token)) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'summonedEffect');
    if (!effect) return;
    let sourceActor = fromUuidSync(effect.origin)?.actor;
    if (!sourceActor) return;
    if (actorUtils.hasUsedReaction(sourceActor)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(sourceActor, true)});
    if (!selection) return;
    await actorUtils.setReactionUsed(sourceActor);
    await item.use();
}
export let investmentOfTheChainMaster = {
    name: 'Eldritch Invocations: Investment of the Chain Master',
    version: '1.1.0'
};
export let investmentOfTheChainMasterActive = {
    name: 'Investment of the Chain Master: Active',
    version: investmentOfTheChainMaster.version,
    midi: {
        actor: [
            {
                pass: 'targetDamageRollComplete',
                macro: hit,
                priority: 50
            }
        ]
    }
};