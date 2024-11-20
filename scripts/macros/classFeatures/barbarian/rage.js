import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
import {start as enlargeReduceStart} from '../../spells/enlargeReduce.js';
async function use({workflow}) {
    let concentrationEffects = Array.from(workflow.actor.concentration.effects);
    await Promise.all(concentrationEffects.map(async effect => await genericUtils.remove(effect)));
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Rage: End', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Rage.End', identifier: 'rageEnd'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let itemsToCreate = [featureData];
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: workflow.item.system.duration.value * 60
        },
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 0
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 0
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'slashing',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'piercing',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'bludgeoning',
                priority: 20
            },
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '+ @scale.barbarian.rage-damage',
                priority: 20
            },
            {
                key: 'flags.midi-qol.fail.spell.vocal',
                value: 1,
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.fail.spell.somatic',
                value: 1,
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.fail.spell.material',
                value: 1,
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'zeroHP'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['rageRaging']);
    if (!itemUtils.getItemByIdentifier(workflow.actor, 'persistentRage')) {
        effectUtils.addMacro(effectData, 'midi.actor', ['rageRaging']);
        effectUtils.addMacro(effectData, 'combat', ['rageRaging']);
    }
    if (itemUtils.getItemByIdentifier(workflow.actor, 'totemSpiritBear')) {
        effectData.changes.push(...[
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'acid',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'cold',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'fire',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'force',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'lightning',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'necrotic',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'poison',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'radiant',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'thunder',
                priority: 20
            },
        ]);
    }
    if (itemUtils.getItemByIdentifier(workflow.actor, 'giantsHavocCrushingThrow')) {
        effectUtils.addMacro(effectData, 'midi.actor', ['giantsHavocCrushingThrow']);
    }
    let giantStature = itemUtils.getItemByIdentifier(workflow.actor, 'giantsHavocGiantStature');
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    let currSize = actorUtils.getSize(workflow.actor);
    if (giantStature && (currSize < (demiurgicColossus ? 4 : 3))) {
        let canBeLarge = currSize < 3 && Object.values(tokenUtils.checkForRoom(workflow.token, 1)).some(i => i);
        let newSize = canBeLarge ? 'lg' : false;
        if (demiurgicColossus) {
            if (Object.values(tokenUtils.checkForRoom(workflow.token, 4 - Math.max(2, currSize))).some(i => i)) {
                if (canBeLarge) {
                    let selection = await dialogUtils.buttonDialog(demiurgicColossus.name, 'CHRISPREMADES.Macros.Rage.LargeOrHuge', [
                        ['DND5E.SizeLarge', 'lg'],
                        ['DND5E.SizeHuge', 'huge']
                    ]);
                    if (selection) newSize = selection;
                } else {
                    let selection = await dialogUtils.confirm(demiurgicColossus.name, 'CHRISPREMADES.Macros.Rage.Huge');
                    if (selection) newSize = 'huge';
                }
            }
        }
        if (newSize) {
            if (newSize === 'huge') {
                demiurgicColossus.displayCard();
            } else {
                giantStature.displayCard();
            }
            if (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon') {
                genericUtils.setProperty(effectData, 'flags.chris-premades.enlargeReduce', {
                    selection: 'enlarge',
                    playAnimation: true,
                    origSize: actorUtils.getSize(workflow.actor, true),
                    newSize
                });
                genericUtils.setProperty(effectData, 'flags.chris-premades.effect.sizeAnimation', false);
            } else {
                effectData.changes.push({
                    key: 'system.traits.size',
                    mode: 5,
                    value: newSize,
                    priority: 20
                });
            }
        }
    }
    let formOfBeastFeature = itemUtils.getItemByIdentifier(workflow.actor, 'formOfTheBeast');
    if (formOfBeastFeature) {
        let selection = await dialogUtils.buttonDialog(formOfBeastFeature.name, 'CHRISPREMADES.Macros.Rage.FormOfBeastWeapon', [
            ['CHRISPREMADES.CommonFeatures.Bite', 'Form of the Beast: Bite'],
            ['CHRISPREMADES.CommonFeatures.Claws', 'Form of the Beast: Claws'],
            ['CHRISPREMADES.CommonFeatures.Tail', 'Form of the Beast: Tail'],
            ['DND5E.None', false]
        ]);
        if (selection) {
            let translationKey = 'CHRISPREMADES.Macros.Rage.' + selection.replace(':','').split(' ').map(x => x.capitalize()).join('');
            let featureData2 = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, selection, {object: true, getDescription: true, translate: translationKey, identifier: 'formOfTheBeastWeapon'});
            if (!featureData2) {
                errors.missingPackItem();
                return;
            }
            if (itemUtils.getItemByIdentifier(workflow.actor, 'bestialSoul')) genericUtils.setProperty(featureData2, 'flags.midiProperties.magicdam', true);
            itemsToCreate.push(featureData2);
            if (selection === 'Form of the Beast: Tail') {
                let featureData3 = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Form of the Beast: Tail Reaction', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Rage.FormOfBeastTailReaction', identifier: 'formOfTheBeastTailReaction'});
                if (!featureData3) {
                    errors.missingPackItem();
                    return;
                }
                itemsToCreate.push(featureData3);
            }
        }
    }
    let vaeInput = itemsToCreate
        .filter(i => i.flags['chris-premades'].info.identifier !== 'formOfTheBeastTailReaction')
        .map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};});
    let mightyImpelFeature = itemUtils.getItemByIdentifier(workflow.actor, 'mightyImpel');
    if (mightyImpelFeature) vaeInput.push({type: 'use', name: mightyImpelFeature.name, identifier: 'mightyImpel'});
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'rage', 
        vae: vaeInput
    });
    await itemUtils.createItems(workflow.actor, itemsToCreate, {favorite: true, section: 'CHRISPREMADES.Section.Rage', parentEntity: effect});
    let callTheHunt = itemUtils.getItemByIdentifier(workflow.actor, 'callTheHunt');
    if (callTheHunt && callTheHunt.system.uses.value) {
        let selection = await dialogUtils.confirm(callTheHunt.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: callTheHunt.name}));
        if (selection) await workflowUtils.completeItemUse(callTheHunt);
    }
    let wildSurge = itemUtils.getItemByIdentifier(workflow.actor, 'wildSurge');
    if (wildSurge) await workflowUtils.completeItemUse(wildSurge);
    let elementalCleaver = itemUtils.getItemByIdentifier(workflow.actor, 'elementalCleaver');
    if (elementalCleaver) await workflowUtils.completeItemUse(elementalCleaver);
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function attack({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    if (!workflow.targets.size) return;
    if (workflow.targets.first().document.disposition === workflow.token.document.disposition) return;
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function damageApplication({workflow, ditem}) {
    let targetActor = await fromUuid(ditem.actorUuid);
    if (!targetActor) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    if (ditem.newHP >= ditem.oldHP) return;
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let lastTurnString = effect.flags['chris-premades']?.rage?.turn ?? '0-0';
    let [lastRound, lastTurn] = lastTurnString.split('-');
    let [currentRound, currentTurn] = combatUtils.currentTurn().split('-');
    let roundDiff = currentRound - lastRound;
    if (roundDiff >= 1) {
        if (currentTurn >= lastTurn) {
            let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.Rage.EndEarly', {actorName: token.actor.name}), {userId: socketUtils.gmID()});
            if (!selection) return;
            await genericUtils.remove(effect);
        }
    }
}
async function end({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (effect) await genericUtils.remove(effect);
}
async function start({trigger: {entity: effect}}, {overrideAnimation = undefined} = {}) {
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let playAnimation = itemUtils.getConfig(originItem, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon';
    if (!playAnimation) return;
    if (effect.flags['chris-premades']?.enlargeReduce) await enlargeReduceStart({trigger: {entity: effect}});
    let animation = overrideAnimation ?? itemUtils.getConfig(originItem, 'animation');
    if (animation === 'none') return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
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

                .play();
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

                .play();
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
async function remove({trigger: {entity: effect}}) {
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    await Sequencer.EffectManager.endEffects({name: 'Rage', object: token});
    new Sequence().animation().on(token).opacity(1).play();
}
export let rage = {
    name: 'Rage',
    version: '0.12.20',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: [
                {
                    value: 'default',
                    label: 'CHRISPREMADES.Config.Animations.Default',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightning',
                    label: 'CHRISPREMADES.Config.Animations.Lightning',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'saiyan',
                    label: 'CHRISPREMADES.Config.Animations.Saiyan',
                    requiredModules: ['jb2a_patreon']
                },
            ]
        }
    ]
};
export let rageEnd = {
    name: 'Rage: End',
    version: rage.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: end,
                priority: 50
            }
        ]
    }
};
export let rageRaging = {
    name: 'Rage: Raging',
    version: rage.version,
    midi: {
        actor: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            },
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    },
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'created',
            macro: start,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};