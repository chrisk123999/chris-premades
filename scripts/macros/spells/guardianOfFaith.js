import {chris} from '../../helperFunctions.js';
import {tokenMove} from '../../utility/movement.js';
import {constants} from '../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Guardian of Faith');
    if (!sourceActor) return;
    async function effectMacro() {
        await chrisPremades.macros.guardianOfFaith.remove(token, origin);
    }
    let spellDC = chris.getSpellDC(workflow.item);
    let effectData = {
        'name': 'Guardian of Faith',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 28800
        },
        'origin': workflow.item.uuid,
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
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Guardian of Faith';
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Guardian of Faith - Damage', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Guardian of Faith - Damage');
    featureData.system.save.dc = spellDC;
    let updates = {
        'actor': {
            'name': name,
            'prototypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        },
        'embedded': {
            'ActiveEffect': {
                [effectData.name]: effectData
            },
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let options = {
        'controllingActor': workflow.token.actor
    };
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, 'Guardian of Faith');
    if (!targetEffect) return;
    let casterEffectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 28800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect); await warpgate.revert(token.document, "Guardian of Faith");'
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, casterEffectData);
    await tokenMove.add('guardianOfFaith', workflow.castData.castLevel, spellDC, null, null, spawnedToken.id, 10, true, true, null, targetEffect.uuid);
    let color = chris.getConfiguration(workflow.item, 'color') ?? 'yellow';
    new Sequence().effect().file('jb2a.bless.400px.loop.' + color).size(spawnedToken.width + 6, {'gridUnits': true}).attachTo(spawnedToken).persist().name('GuardianOfFaith-' + workflow.token.id).fadeIn(300).fadeOut(300).play();
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let appliedDamage = workflow.damageList[0].appliedDamage;
    if (!appliedDamage) return;
    await workflow.item.update({'system.uses.value': workflow.item.system.uses.value - appliedDamage});
    if (workflow.item.system.uses.value > 0) return;
    let effect = chris.findEffect(workflow.actor, 'Guardian of Faith');
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function remove(token, origin) {
    let originActor = origin.actor;
    let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
    if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    await tokenMove.remove('guardianOfFaith', token.id);
    Sequencer.EffectManager.endEffects({ 'name': 'GuardianOfFaith-' + token.id, 'object': token});
    await warpgate.dismiss(token.id);
}
async function moved(token, castLevel, spellDC, damage, damageType, sourceTokenID) {
    let doDamage = false;
    if (!chris.inCombat()) {
        doDamage = true;
    } else {
        let combatant = game.combat.combatants.get(game.combat.current.combatantId);
        let lastTriggerTurn = combatant.flags?.['chris-premades']?.spell?.guardianOfFaith?.[sourceTokenID]?.lastTriggerTurn;
        let currentTurn = game.combat.current.round + '-' + game.combat.current.turn;
        if (!lastTriggerTurn || lastTriggerTurn != currentTurn) {
            doDamage = true;
            await combatant.setFlag('chris-premades', 'spell.guardianOfFaith.' + sourceTokenID + '.lastTriggerTurn', currentTurn);
        }
    }
    if (!doDamage) return;
    let attacker = canvas.scene.tokens.get(sourceTokenID);
    if (!attacker) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    let feature = attacker.actor.items.getName('Guardian of Faith - Damage');
    if (!feature) return;
    await MidiQOL.completeItemUse(feature, config, options);
}
export let guardianOfFaith = {
    'item': item,
    'attack': attack,
    'remove': remove,
    'moved': moved
}