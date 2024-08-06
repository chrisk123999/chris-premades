import {actorUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function late({workflow}) {
    await actorUtils.removeReactionUsed(workflow.actor);
    let controllingActor = await fromUuid(workflow.actor.flags['chris-premades'].summons.control.actor);
    if (!controllingActor) return;
    await actorUtils.setReactionUsed(controllingActor);
    let summonerEffect = effectUtils.getEffectByIdentifier(controllingActor, 'findFamiliar');
    if (!summonerEffect) summonerEffect = effectUtils.getEffectByIdentifier(controllingActor, 'flockOfFamiliars');
    let summonedActors = summonerEffect?.flags['chris-premades'].summons.ids[summonerEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor);
    if (!summonedActors?.length) return;
    for (let currActor of summonedActors) {
        let resistanceItem = itemUtils.getItemByIdentifier(currActor, 'investmentOfTheChainMasterResistance');
        if (!resistanceItem) continue;
        await genericUtils.update(resistanceItem, {'system.uses.max': 1});
    }
}
async function turnStart({trigger: {token}}) {
    let summonerEffect = effectUtils.getEffectByIdentifier(token.actor, 'findFamiliar');
    if (!summonerEffect) summonerEffect = effectUtils.getEffectByIdentifier(token.actor, 'flockOfFamiliars');
    let summonedActors = summonerEffect?.flags['chris-premades'].summons.ids[summonerEffect?.name]?.map(i => canvas.scene.tokens.get(i)?.actor);
    if (!summonedActors?.length) return;
    for (let currActor of summonedActors) {
        let resistanceItem = itemUtils.getItemByIdentifier(currActor, 'investmentOfTheChainMasterResistance');
        if (!resistanceItem) continue;
        await genericUtils.update(resistanceItem, {'system.uses.max': 0});
    }
}
export let investmentOfTheChainMaster = {
    name: 'Investment of the Chain Master',
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