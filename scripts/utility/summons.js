import {chris} from '../helperFunctions.js';
import {socket} from '../module.js';
async function spawn(sourceActors, updates, duration, originItem, casterToken, maxRange, options = {useActorOrigin: false, groupInitiative: false, spawnAnimation: 'default', callbacks: {}, canTurnHostile: false}) {
    async function effectMacro () {
        let summons = effect.flags['chris-premades']?.summons?.ids[effect.name];
        if (!summons) return;
        for (let i of summons) await warpgate.dismiss(i);
    }
    if (!sourceActors?.length) {
        ui.notifications.warn('CPR summons.js | sourceActors doesn\'t have a length, is it an array?');
        return;
    }
    let effect = chris.findEffect(originItem.actor, originItem.name);
    if (!effect) {
        let casterEffectData = {
            'name': originItem.name,
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
        if (options.useActorOrigin) casterEffectData.origin = originItem.actor.uuid;
        effect = await chris.createEffect(originItem.actor, casterEffectData);
    }
    if (!effect) return;
    if (originItem.requiresConcentration && !options.canTurnHostile) {
        await chris.addDependent(MidiQOL.getConcentrationEffect(originItem.actor, originItem), [effect]);
    }
    let effectData = {
        'name': 'Summoned Creature',
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
    let summonsIds = effect.flags['chris-premades']?.summons?.ids[originItem.name] ?? [];
    let overwriteInitiative = chris.getConfiguration(originItem, 'overwriteinitiative');
    let groupInitiativeValue;
    for (let i = 0; i < sourceActors.length; i++) {
        let updates2 = Array.isArray(updates) ? updates[i] : duplicate(updates);
        setProperty(updates2, 'embedded.ActiveEffect.Summoned Creature', effectData);
        if (originItem.actor.flags['chris-premades']?.feature?.undeadThralls && originItem.system.school === 'nec') { // Undead Thralls automation
            let wizardLevels = originItem.actor.classes.wizard?.system?.levels;
            if (wizardLevels) {
                setProperty(updates2, 'actor.system.attributes.hp.formula', sourceActors[i].system.attributes.hp.formula + ' + ' + wizardLevels);
                setProperty(updates2, 'actor.system.bonuses.mwak.damage', originItem.actor.system.attributes.prof);
                setProperty(updates2, 'actor.system.bonuses.rwak.damage', originItem.actor.system.attributes.prof);
            }
        }
        let spawnedTokens = await chris.spawn(sourceActors[i], updates2, options.callbacks, casterToken, maxRange, options.spawnAnimation);
        if (!spawnedTokens) return;
        let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
        if (!spawnedToken) return;
        summonsIds.push(spawnedToken.id);
        if (chris.inCombat()) {
            let casterCombatant = game.combat.combatants.contents.find(combatant => combatant.actorId === originItem.actor.id);
            if (casterCombatant) {
                let initiative;
                if (options.groupInitiative) {
                    if (groupInitiativeValue) {
                        await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, groupInitiativeValue);
                    } else {
                        await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, null);
                        await spawnedToken.actor.rollInitiative();
                        groupInitiativeValue = spawnedToken.actor.initiative;
                    }
                } else if (game.settings.get('chris-premades', 'Tasha Initiative') != overwriteInitiative) {
                    initiative = casterCombatant.initiative - 0.01;
                    await socket.executeAsGM('createCombatant', spawnedToken.id, spawnedToken.actor.id, canvas.scene.id, initiative);
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
    };
    await chris.updateEffect(effect, effectUpdates);
}
export let summons = {
    'spawn': spawn,
};