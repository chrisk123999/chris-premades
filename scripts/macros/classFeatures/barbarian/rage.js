import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor || !workflow.token) return;
    let effect = chris.findEffect(workflow.actor, 'Concentrating');
    if (effect) chris.removeEffect(effect);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Rage - End', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rage - End');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Rage');
        await chrisPremades.macros.rage.animationEnd(token, origin);
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
        'label': workflow.item.name,
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
            }
        }
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
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
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
}
async function end({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor) return;
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    //todo: Automate keeping track of attacks and being attacked.
}
async function attacked({speaker, actor, token, character, item, args, scope, workflow}) {

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
    let animation = chris.getConfiguration(origin, 'animation') ?? 'none';
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
    'animationEnd': animationEnd
}