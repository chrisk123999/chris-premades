import {actorUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function late({workflow}) {
    let controllingActor = await fromUuid(workflow.actor.flags['chris-premades'].summons.control.actor);
    if (!controllingActor) return;
    await actorUtils.setReactionUsed(controllingActor);
    await actorUtils.removeReactionUsed(workflow.actor, true);
    let findEffect = effectUtils.getEffectByIdentifier(controllingActor, 'findFamiliar');
    let flockEffect = effectUtils.getEffectByIdentifier(controllingActor, 'flockOfFamiliars');
    let findActors = findEffect?.flags['chris-premades'].summons.ids[findEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor) ?? [];
    let flockActors = flockEffect?.flags['chris-premades'].summons.ids[flockEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor) ?? [];
    let summonedActors = findActors.concat(flockActors);
    if (!summonedActors?.length) return;
    for (let currActor of summonedActors) {
        let resistanceItem = itemUtils.getItemByIdentifier(currActor, 'investmentOfTheChainMasterResistance');
        if (!resistanceItem) continue;
        await genericUtils.update(resistanceItem, {'system.uses.value': 0});
    }
}
async function turnStart({trigger: {token}}) {
    let findEffect = effectUtils.getEffectByIdentifier(token.actor, 'findFamiliar');
    let flockEffect = effectUtils.getEffectByIdentifier(token.actor, 'flockOfFamiliars');
    let findActors = findEffect?.flags['chris-premades'].summons.ids[findEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor) ?? [];
    let flockActors = flockEffect?.flags['chris-premades'].summons.ids[flockEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor) ?? [];
    let summonedActors = findActors.concat(flockActors);
    if (!summonedActors?.length) return;
    for (let currActor of summonedActors) {
        let resistanceItem = itemUtils.getItemByIdentifier(currActor, 'investmentOfTheChainMasterResistance');
        if (!resistanceItem) continue;
        await genericUtils.update(resistanceItem, {'system.uses.value': 1});
    }
}
export let investmentOfTheChainMaster = {
    name: 'Eldritch Invocations: Investment of the Chain Master',
    version: '0.12.9'
};
export let investmentOfTheChainMasterActive = {
    name: 'Investment of the Chain Master: Active',
    version: investmentOfTheChainMaster.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};