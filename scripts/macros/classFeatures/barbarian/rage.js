import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {enlargeReduce} from '../../spells/enlargeReduce.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor || !workflow.token) return;
    let effect = chris.findEffect(workflow.actor, 'Concentrating');
    if (effect) chris.removeEffect(effect);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Rage - End', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rage - End');
    async function effectMacro () {
        if (chrisPremades.helpers.getItem(actor, 'Call the Hunt')) await chrisPremades.macros.callTheHunt.rageEnd(effect);
        await warpgate.revert(token.document, 'Rage');
        await chrisPremades.macros.rage.animationEnd(token, origin);
        if (chrisPremades.helpers.getItem(actor, 'Giant\'s Havoc: Giant Stature')) await warpgate.revert(token.document, 'Giant Stature');
        let effect2 = chrisPremades.helpers.findEffect(actor, 'Elemental Cleaver');
        if (effect2) await chrisPremades.helpers.removeEffect(effect2);
    }
    async function effectMacro2 () {
        await chrisPremades.macros.rage.animationStart(token, origin);
    }
    let effectData = {
        'changes': [
            {
                'key': 'flags.midi-qol.advantage.ability.check.str',
                'mode': 0,
                'value': '1',
                'priority': 0
            },
            {
                'key': 'flags.midi-qol.advantage.ability.save.str',
                'mode': 0,
                'value': '1',
                'priority': 0
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'slashing',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'piercing',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'bludgeoning',
                'priority': 20
            },
            {
                'key': 'system.bonuses.mwak.damage',
                'mode': 2,
                'value': '+ @scale.barbarian.rage-damage',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.vocal',
                'value': '1',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.somatic',
                'value': '1',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.material',
                'value': '1',
                'mode': 0,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 60
        },
        'icon': workflow.item.img,
        'name': workflow.item.name,
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                },
                'onCreate': {
                    'script': chris.functionToString(effectMacro2)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            },
            'dae': {
                'specialDuration': [
                    'zeroHP'
                ]
            }
        }
    }
    if (!chris.getItem(actor, 'Persistent Rage')) {
        effectData.changes = effectData.changes.concat([
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.rage.attack,postActiveEffects',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.feature.onHit.rage',
                'mode': 5,
                'value': true,
                'priority': 20
            }
        ]);
        effectData.flags.effectmacro.onTurnEnd = {
            'script': 'await chrisPremades.macros.rage.turnEnd(effect, actor);'
        }
        effectData.flags.effectmacro.onCombatStart = {
            'script': 'await chrisPremades.macros.rage.combatStart(effect);'
        }
        if (chris.inCombat()) setProperty(effectData, 'flags.chris-premades.feature.rage.attackOrAttacked', {'turn': game.combat.turn, 'round': game.combat.round});
    }
    let totemBear = chris.getItem(workflow.actor, 'Totem Spirit: Bear');
    if (totemBear) {
        effectData.changes = effectData.changes.concat([
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'acid',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'cold',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'fire',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'force',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'lightning',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'necrotic',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'poison',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'radiant',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'thunder',
                'priority': 20
            }
        ]);
    }
    let crushingThrow = chris.getItem(workflow.actor, 'Giant\'s Havoc: Crushing Throw');
    if (crushingThrow) {
        effectData.changes = effectData.changes.concat([
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.crushingThrow,postDamageRoll',
                'priority': 20
            }
        ]);
    }
    let giantStature = chris.getItem(workflow.actor, 'Giant\'s Havoc: Giant Stature');
    let demiurgicColossus = chris.getItem(workflow.actor, 'Demiurgic Colossus');
    let dCSelection = 'lg';
    if (demiurgicColossus) dCSelection = await chris.dialog(demiurgicColossus.name, [['Large', 'lg'], ['Huge', 'huge']], 'What size?') ?? 'lg';
    if (dCSelection === 'huge') await demiurgicColossus.displayCard();
    if (giantStature && workflow.token.document.width < 2) {
        let updates2 = {
            'token': {
                'width': dCSelection === 'lg' ? 2 : 3,
                'height': dCSelection === 'lg' ? 2 : 3
            },
            'actor': {
                'system': {
                    'traits': {
                        'size': dCSelection
                    }
                }
            }
        }
        if (chris.jb2aCheck() === 'patreon') {
            await enlargeReduce.enlargeAnimation(workflow.token, updates2, 'Giant Stature');
        } else {
            let options = {
                'permanent': false,
                'name': 'Giant Stature',
                'description': 'Giant Stature'
            };
            await warpgate.mutate(workflow.token.document, updates2, {}, options);
        }
        effectData.changes = effectData.changes.concat([
            {
                'key': 'flags.midi-qol.range.mwak',
                'mode': 2,
                'value': (demiurgicColossus ? 10 : 5),
                'priority': 20
            }
        ]);
        await giantStature.displayCard();
    }
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let formOfBeastFeature = chris.getItem(workflow.actor, 'Form of the Beast');
    if (formOfBeastFeature) {
        let selection = await chris.dialog(formOfBeastFeature.name, [['Bite', 'Form of the Beast: Bite'], ['Claws', 'Form of the Beast: Claws'], ['Tail', 'Form of the Beast: Tail'], ['None', false]], 'Manifest a natural weapon?');
        if (selection) {
            let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', selection);
            if (!featureData2) return;
            featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', selection);
            if (chris.getItem(workflow.actor, 'Bestial Soul')) setProperty(featureData2, 'flags.midiProperties.magicdam', true);
            setProperty(featureData2, 'flags.chris-premades.feature.formOfTheBeast.natural', true);
            updates.embedded.Item[selection] = featureData2;
            if (selection === 'Form of the Beast: Tail') {
                let featureData3 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Form of the Beast: Tail Reaction');
                if (!featureData3) return;
                featureData3.system.description.value = chris.getItemDescription('CPR - Descriptions', featureData3.name);
                updates.embedded.Item[featureData3.name] = featureData3;
            }
            await formOfBeastFeature.use();
        }
    }
    let options = {
        'permanent': false,
        'name': 'Rage',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let callTheHunt = chris.getItem(workflow.actor, 'Call the Hunt');
    if (callTheHunt) {
        if (callTheHunt.system.uses.value) {
            let selection = await chris.dialog(callTheHunt.name, constants.yesNo, 'Use ' + callTheHunt.name + '?');
            if (selection) await callTheHunt.use();
        }
    }
    let wildSurge = chris.getItem(workflow.actor, 'Wild Surge');
    if (wildSurge) await wildSurge.use();
    let elementalCleaver = chris.getItem(workflow.actor, 'Elemental Cleaver');
    if (elementalCleaver) await elementalCleaver.use();
}
async function end({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor) return;
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    if (!chris.inCombat()) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    await effect.setFlag('chris-premades', 'feature.rage.attackOrAttacked', {'turn': game.combat.turn, 'round': game.combat.round});
}
async function attacked(workflow, token) {
    let effect = chris.findEffect(token.actor, 'Rage');
    if (!effect) return;
    if (!chris.inCombat()) return;
    if (!workflow.damageRoll) return;
    let damageItem = workflow.damageList.find(i => i.tokenId === token.id);
    if (!damageItem) return;
    if (damageItem.newHP >= damageItem.oldHP) return;
    let updates = {
        'flags': {
            'chris-premades': {
                'feature': {
                    'rage': {
                        'attackOrAttacked': {
                            'turn': game.combat.turn,
                            'round': game.combat.round
                        }
                    }
                }
            }
        }
    };
    await chris.updateEffect(effect, updates);
}
async function turnEnd(effect, actor) {
    let lastRound = effect.flags['chris-premades']?.feature?.rage?.attackOrAttacked?.round;
    let lastTurn = effect.flags['chris-premades']?.feature?.rage?.attackOrAttacked?.turn;
    if (lastRound === undefined || lastTurn === undefined) return;
    let currentRound = game.combat.previous.round;
    let currentTurn = game.combat.previous.turn;
    let roundDiff = currentRound - lastRound;
    if (roundDiff >= 1) {
        if (currentTurn >= lastTurn) {
            let userId = chris.lastGM();
            let selection = await chris.remoteDialog('Rage', constants.yesNo, userId, actor.name + ' has not attacked an enemy or taken damage since their last turn. Remove Rage?');
            if (!selection) return;
            await chris.removeEffect(effect);
        }
    }
}
async function combatStart(effect) {
    await effect.setFlag('chris-premades', 'feature.rage.attackOrAttacked', {'turn': 0, 'round': 0});
}
async function animationStart(token, origin) {
    //Animations by: eskiemoh
    let animation = chris.getConfiguration(origin, 'animation') ?? 'default';
    if (animation === 'none' || chris.jb2aCheck() === 'free') return;
    switch (animation) {
        case 'default':
            new Sequence()
                
                .effect()
                .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
                .atLocation(token)
                .size(4, {'gridUnits': true})
                .opacity(0.25)
                
                .effect()
                .file('jb2a.impact.ground_crack.orange.02')
                .atLocation(token)
                .belowTokens()
                .filter('ColorMatrix', {'hue': -15,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .zIndex(1)
                
                .effect()
                .file('jb2a.impact.ground_crack.still_frame.02')
                .atLocation(token)
                .belowTokens()
                .fadeIn(1000)
                .filter('ColorMatrix', {'hue': -15,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .zIndex(0)
                .duration(8000)
                .fadeOut(3000)
                
                .effect()
                .file('jb2a.wind_stream.white')
                .atLocation(token, {'offset': {y:-0.05}, 'gridUnits': true})
                .size(1.75, {'gridUnits': true})
                .rotate(90)
                .opacity(0.9)
                .filter('ColorMatrix', {'saturate': 1})
                .tint('#FF0000')
                .loopProperty('sprite', 'position.y', {'from': -5, 'to': 5, 'duration': 50, 'pingPong': true})
                .duration(8000)
                .fadeOut(3000)
                
                .effect()
                .file('jb2a.particles.outward.orange.01.03')
                .atLocation(token)
                .scaleToObject(2.5)
                .opacity(1)
                .fadeIn(200)
                .fadeOut(3000)
                .loopProperty('sprite', 'position.x', {'from': -5, 'to': 5, 'duration': 50, 'pingPong': true})
                .animateProperty('sprite', 'position.y', {'from': 0, 'to': -100, 'duration': 6000, 'pingPong': true, 'delay': 2000})
                .duration(8000)
                
                .effect()
                .file('jb2a.wind_stream.white')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .scaleToObject()
                .rotate(90)
                .opacity(1)
                .filter('ColorMatrix', {'saturate': 1})
                .tint('#FF0000')
                .persist()
                .private()
                
                .effect()
                .file('jb2a.token_border.circle.static.orange.012')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .opacity(0.6)
                .scaleToObject(1.9)
                .filter('ColorMatrix', {'saturate': 1})
                .tint('#FF0000')
                .persist()

                .play()
            break;
        case 'lightning':
            new Sequence()

                .effect()
                .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
                .atLocation(token)
                .size(4, {'gridUnits': true})
                .opacity(0.25)

                .effect()
                .file('jb2a.impact.ground_crack.purple.02')
                .atLocation(token)
                .belowTokens()
                .filter('ColorMatrix', {'hue': -15,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .zIndex(1)

                .effect()
                .file('jb2a.impact.ground_crack.still_frame.02')
                .atLocation(token)
                .belowTokens()
                .fadeIn(1000)
                .filter('ColorMatrix', {'hue': -15,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .duration(8000)
                .fadeOut(3000)
                .zIndex(0)

                .effect()
                .file('jb2a.static_electricity.03.purple')
                .atLocation(token)
                .size(3, {'gridUnits': true})
                .rotate(90)
                .randomRotation()
                .opacity(0.75)
                .belowTokens()
                .duration(8000)
                .fadeOut(3000)

                .effect()
                .file('jb2a.particles.outward.purple.01.03')
                .atLocation(token)
                .scaleToObject(2.5)
                .opacity(1)
                .fadeIn(200)
                .fadeOut(3000)
                .loopProperty('sprite', 'position.x', {'from': -5, 'to': 5, 'duration': 50, 'pingPong': true})
                .animateProperty('sprite', 'position.y', {'from': 0, 'to': -100, 'duration': 6000, 'pingPong': true, 'delay': 2000})
                .duration(8000)

                .effect()
                .file('jb2a.static_electricity.03.purple')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .scaleToObject()
                .rotate(90)
                .opacity(1)
                .persist()
                .private()

                .effect()
                .file('jb2a.token_border.circle.static.purple.009')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .belowTokens()
                .opacity(1)
                .scaleToObject(2.025)
                .persist()
                .zIndex(5)

                .play()
            break;
        case 'saiyan':
            new Sequence()

                .effect()
                .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
                .atLocation(token)
                .size(4, {'gridUnits': true})
                .opacity(0.25)

                .effect()
                .file('jb2a.impact.ground_crack.orange.02')
                .atLocation(token)
                .belowTokens()
                .filter('ColorMatrix', {'hue': 20,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .zIndex(1)

                .effect()
                .file('jb2a.impact.ground_crack.still_frame.02')
                .atLocation(token)
                .belowTokens()
                .fadeIn(2000)
                .filter('ColorMatrix', {'hue': -15,'saturate': 1})
                .size(3.5, {'gridUnits': true})
                .duration(8000)
                .fadeOut(3000)
                .zIndex(0)

                .effect()
                .file('jb2a.wind_stream.white')
                .atLocation(token, {'offset':{'y':75}})
                .size(1.75, {'gridUnits': true})
                .rotate(90)
                .opacity(1)
                .loopProperty('sprite', 'position.y', {'from': -5, 'to': 5, 'duration': 50, 'pingPong': true})
                .duration(8000)
                .fadeOut(3000)
                .tint('#FFDD00')

                .effect()
                .file('jb2a.particles.outward.orange.01.03')
                .atLocation(token)
                .scaleToObject(2.5)
                .opacity(1)
                .fadeIn(200)
                .fadeOut(3000)
                .loopProperty('sprite', 'position.x', {'from': -5, 'to': 5, 'duration': 50, 'pingPong': true})
                .animateProperty('sprite', 'position.y', {'from': 0, 'to': -100, 'duration': 6000, 'pingPong': true, 'delay': 2000})
                .duration(8000)

                .effect()
                .file('jb2a.wind_stream.white')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .scaleToObject()
                .rotate(90)
                .opacity(1)
                .filter('ColorMatrix', {'saturate': 1})
                .tint('#FFDD00')
                .persist()
                .private()

                .effect()
                .file('jb2a.token_border.circle.static.orange.012')
                .atLocation(token)
                .name('Rage')
                .attachTo(token)
                .opacity(0.7)
                .scaleToObject(1.9)
                .filter('ColorMatrix', {'hue': 30, 'saturate': 1 , 'contrast': 0, 'brightness': 1})
                .persist()

                .play();
            break;
    }
}
async function animationEnd(token, origin) {
    let animation = chris.getConfiguration(origin, 'animation') ?? 'default';
    if (animation === 'none') return;
    await Sequencer.EffectManager.endEffects({'name': 'Rage', 'object': token});
    new Sequence()
        .animation()
        .on(token)
        .opacity(1)

        .play();
}
export let rage = {
    'item': item,
    'end': end,
    'animationStart': animationStart,
    'animationEnd': animationEnd,
    'attack': attack,
    'attacked': attacked,
    'turnEnd': turnEnd,
    'combatStart': combatStart
}