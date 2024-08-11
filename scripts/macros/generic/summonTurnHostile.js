import {effectUtils, genericUtils, socketUtils} from '../../utils.js';

async function remove({trigger: {entity: effect}}) {
    let parentEffect = await fromUuid(effect.flags['chris-premades'].summons.parentEffect);
    let scenes = parentEffect.flags['chris-premades'].summons.scenes[parentEffect.name];
    let tokenIds = parentEffect.flags['chris-premades'].summons.ids[parentEffect.name];
    let childEffectUuids = [];
    for (let i = 0; i < scenes.length; i++) {
        let currToken = game.scenes.get(scenes[i])?.tokens.get(tokenIds[i]);
        if (!currToken) continue;
        await genericUtils.update(currToken, {
            disposition: currToken.disposition * -1,
            flags: {
                'chris-premades': {
                    summons: {
                        turnedHostile: true
                    }
                }
            }
        });
        await genericUtils.update(currToken.actor, {
            ownership: {
                [socketUtils.firstOwner(currToken.actor).id]: 0
            }
        });
        childEffectUuids.push(effectUtils.getEffectByIdentifier(currToken.actor, 'summonedEffect')?.uuid);
    }
    await genericUtils.update(parentEffect, {
        flags: {
            dnd5e: {
                dependents: parentEffect.flags.dnd5e.dependents.filter(i => !childEffectUuids.includes(i.uuid))
            },
            'chris-premades': {
                macros: {
                    effect: []
                }
            }
        }
    });
    await genericUtils.remove(parentEffect);
}
export let summonTurnHostile = {
    name: 'Summon: Turn Hostile',
    version: '0.12.12',
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};