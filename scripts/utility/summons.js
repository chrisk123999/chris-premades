import {chris} from '../helperFunctions.js';
import {socket} from '../module.js';
async function spawn(sourceActors, updates, duration, originItem) {
    async function effectMacro () {
        let summons = effect.flags['chris-premades'].summons.ids[effect.label];
        if (!summons) return;
        for (let i of summons) await warpgate.dismiss(i);
    }
    let effect = chris.findEffect(originItem.actor, originItem.name);
    if (!effect) {
        let casterEffectData = {
            'label': originItem.name,
            'icon': originItem.img,
            'duration': {
                'seconds': duration
            },
            'origin': originItem.uuid,
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': chris.functionToString(effectMacro)
                    }
                },
                'chris-premades': {
                    'vae': {
                        'button': 'Dismiss Summon'
                    }
                }
            }
        };
        await chris.createEffect(originItem.actor, casterEffectData);
        effect = chris.findEffect(originItem.actor, originItem.name);
    }
    if (!effect) return;
    let effectData = {
        'label': 'Summoned Creature',
        'icon': originItem.img,
        'duration': {
            'seconds': duration
        },
        'origin': originItem.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + effect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect);'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Dismiss Summon'
                }
            }
        }
    };
    if (!updates) updates = {};
    setProperty(updates, 'embedded.ActiveEffect.Summoned Creature', effectData);
    let options = {
        'controllingActor': originItem.actor
    };
    let summonsIds = effect.flags['chris-premades']?.summons?.ids[originItem.name] ?? [];
    for (let i of sourceActors) {
        let tokenDocument = await i.getTokenDocument();
        setProperty(updates, 'actor.name', i.prototypeToken.name);
        let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
        if (!spawnedTokens) return;
        let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
        if (!spawnedToken) return;
        summonsIds.push(spawnedToken.id);
        if (chris.inCombat()) {
            let casterCombatant = game.combat.combatants.contents.find(combatant => combatant.actorId === originItem.actor.id);
            if (casterCombatant) {
                let initiative;
                if (game.settings.get('chris-premades', 'Tasha Initiative') === true) {
                    initiative = casterCombatant.initiative - 0.01;
                    await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, initiative)
                } else {
                    await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, null);
                    await spawnedToken.actor.rollInitiative();
                }
            }
        }
    }
    let effectUpdates = {
        'flags': {
            'chris-premades': {
                'summons': {
                    'ids': {
                        [originItem.name]: summonsIds
                    }
                }
            }
        }
    }
    await chris.updateEffect(effect, effectUpdates);
}
export let summons = {
    'spawn': spawn,
};
/*
Conjure spells:
Animals - fucky selection
//
Celestial - one of filter
Elemental - one of filter - becomes hostile
Fey - one of filter - becomes hostile
minor elementals - fucky selection
woodland beasts - fucky selection
Summons:
Greater demons - one of filter - might attack
Lesser demons - rolls then prompts dm for the selection, then summon is from player, all hostile, can only protect your spot. template?
animate:
dead - only skeleton or zombie, amount of them OR refresh them, not sure if that matters
objects - whole math of objects and shit
*/