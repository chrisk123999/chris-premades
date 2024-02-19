import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
import {queue} from '../../utility/queue.js';
export async function teleport({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'teleport', 50);
    if (!queueSetup) return;
    let gmID = game.settings.get('chris-premades', 'LastGM');
    let doAnimation = false;
    let targetTokens = [];
    if (workflow.token) {
        doAnimation = true;
        let targets = chris.findNearby(workflow.token, 10, 'ally', true, false);
        if (targets.length > 0) {
            let selection = await chris.selectTarget('Who else is getting teleported?', constants.okCancel, targets, true, 'multiple');
            if (selection.buttons) {
                targetTokens = selection.inputs.filter(i => i).map(i => fromUuidSync(i));
            }
            if (targetTokens.length > 8) {
                ui.notifications.info('Too many targets selected!');
                queue.remove(workflow.item.uuid);
                return;
            }
        }
        targetTokens.push(workflow.token.document);
    }
    let options = [
        ['Permanent Circle', 'pc'],
        ['Associated Object', 'ao'],
        ['Very Familiar', 'vf'],
        ['Seen Casually', 'sc'],
        ['Viewed Once', 'vo'],
        ['Description', 'd'],
        ['False Destination', 'fd']
    ];
    let selection = await chris.remoteDialog(workflow.item.name, options, gmID, 'What is the Familiarity?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let flavor = 'Mishap';
    let totalDamage = 0;
    while (flavor === 'Mishap') {
        if (totalDamage > 0) await warpgate.wait(100);
        let roll = await new Roll('1d100').roll({'async': true});
        let total = roll.total;
        switch (selection) {
            case 'pc':
            case 'ao':
                flavor = 'On Target'
                break;
            case 'vf':
                if (0 <= total && total < 6) {
                    flavor = 'Mishap';
                    totalDamage += 3;
                } else if (6 <= total && total < 14) {
                    flavor = 'Similar Area';
                } else if (14 <= total && total < 25) {
                    flavor = 'Off Target';
                } else if (25 <= total && total <= 100) {
                    flavor = 'On Target';
                }
                break;
            case 'sc':
                if (0 <= total && total < 34) {
                    flavor = 'Mishap';
                    totalDamage += 3;
                } else if (34 <= total && total < 44) {
                    flavor = 'Similar Area';
                } else if (44 <= total && total < 54) {
                    flavor = 'Off Target';
                } else if (54 <= total && total <= 100) {
                    flavor = 'On Target';
                }
                break;
            case 'vo':
            case 'd':
                if (0 <= total && total < 44) {
                    flavor = 'Mishap';
                    totalDamage += 3;
                } else if (44 <= total && total < 54) {
                    flavor = 'Similar Area';
                } else if (54 <= total && total < 74) {
                    flavor = 'Off Target';
                } else if (74 <= total && total <= 100) {
                    flavor = 'On Target';
                }
                break;
            case 'fd':
                if (0 <= total && total < 51) {
                    flavor = 'Mishap';
                    totalDamage += 3;
                } else if (51 <= total && total <= 100) {
                    flavor = 'Similar Area';
                }
                break;
        }
        roll.toMessage({
            'rollMode': 'roll',
            'speaker': {'alias': name},
            'flavor': flavor,
            'whisper': [gmID]
        },
        {
            'rollMode': CONST.DICE_ROLL_MODES.BLIND
        });
    }
    if (totalDamage > 0) {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Teleport - Damage', false);
        if (!featureData) {
            queue.remove(workflow.item.uuid);
            return;
        }
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Teleport - Damage');
        featureData.system.damage.parts[0][0] = totalDamage + 'd10[' + translate.damageType('force') + ']';
        let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
        let [config, options] = constants.syntheticItemWorkflowOptions(targetTokens.map(i => i.uuid));
        await warpgate.wait(100);
        await MidiQOL.completeItemUse(feature, config, options);
    }
    if (flavor === 'Off Target') {
        let roll = await new Roll('1d10 * 1d10').roll({'async': true});
        roll.toMessage({
            'rollMode': 'roll',
            'speaker': {'alias': name},
            'flavor': 'Off Target - Distance',
            'whisper': [gmID]
        },
        {
            'rollMode': CONST.DICE_ROLL_MODES.BLIND
        });
        let roll2 = await new Roll('1d8').roll({'async': true});
        roll2.toMessage({
            'rollMode': 'roll',
            'speaker': {'alias': name},
            'flavor': 'Off Target - Direction',
            'whisper': [gmID]
        },
        {
            'rollMode': CONST.DICE_ROLL_MODES.BLIND
        });
        let inputs = [
            {
                'label': 'Distance',
                'type': 'number'
            },
            {
                'label': 'Units:',
                'type': 'select',
                'options': [
                    {
                        'html': 'Miles',
                        'value': 'miles'
                    },
                    {
                        'html': 'Feet',
                        'value': 'feet'
                    }
                ]
            }
        ];
        let location = await chris.remoteMenu('How far away is the destination?', constants.okCancel, inputs, true, gmID);
        if (!location.buttons) {
            queue.remove(workflow.item.uuid);
            return;
        }
        let distance = Math.floor((roll.total / 100) * location.inputs[0]);
        let directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        ChatMessage.create({
            'speaker': {'alias': name},
            'content': 'Destination is ' + distance + ' ' + location.inputs[1] + ' ' + directions[roll2.total - 1] + ' of the intended location.',
            'whisper': [gmID],
            'blind': true
        });
    }
    if (!doAnimation || chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (workflow.actor) await workflow.actor.sheet.minimize();
    let selected = workflow.token;
    let teleOut = new Sequence()
        .effect()
        .file('jb2a.particles.outward.blue.01.05')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .scaleToObject(1.7)
        .fadeIn(3000, {'ease': 'easeInExpo'})
        .duration(5500)

        .effect()
        .file('jb2a.particles.outward.blue.01.05')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .scaleToObject(4)
        .belowTokens()
        .fadeIn(3000, {'ease': 'easeInExpo'})
        .duration(5500)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.intro.blue')
        .atLocation(selected)
        .belowTokens()
        .scaleToObject(3)
        .filter('ColorMatrix', {'saturate': -0.25, 'brightness': 1})
        .opacity(0.8)
        .waitUntilFinished(-500)

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -0.5, 'brightness': 1.5})
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(3)
        .duration(2500)

        .effect()
        .file('jb2a.extras.tmfx.outpulse.circle.02.fast')
        .atLocation(selected)
        .opacity(0.5)
        .scaleToObject(3)
        .duration(2500)

        .animation()
        .on(selected)
        .delay(2000)
        .opacity(0)

        .thenDo(function() {
            targetTokens.filter(i => i.uuid != selected.document.uuid).forEach(target => {  
                new Sequence()
                    .animation()
                    .on(target)
                    .delay(2000)
                    .opacity(0)

                    .effect()
                    .from(target)
                    .atLocation(target)
                    .scaleToObject(1.1)
                    .fadeIn(2000, {'ease': 'easeInExpo'})
                    .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
                    .filter('Blur', { 'blurX': 5, 'blurY': 10})
                    .scaleOut(0, 100, {'ease': 'easeOutCubic'})
                    .duration(2500)
                    .attachTo(target, {'bindAlpha': false})
                    .waitUntilFinished(-200)

                    .play();
                })
            }
        )

        .effect()
        .from(selected)
        .atLocation(selected)
        .scaleToObject(1.1)
        .fadeIn(2000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .scaleOut(0, 100, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'scale.x', {'from': 0.5, 'to': 0, 'duration': 500, 'delay': 2500, 'ease': 'easeOutElastic'})
        .animateProperty('spriteContainer', 'position.y', {'from': 0, 'to': -1000, 'duration': 500, 'delay': 2500, 'ease': 'easeOutCubic'})
        .fadeOut(100)
        .duration(2500+500)
        .attachTo(selected, {'bindAlpha': false})
        .waitUntilFinished(-700)

        .effect()
        .file('modules/animated-spell-effects-cartoon/spell-effects/cartoon/energy/energy_pulse_yellow_CIRCLE.webm')
        .atLocation(selected)
        .opacity(1)
        .scaleToObject(4)
        .filter('ColorMatrix', {'saturate': -1, 'hue': 160, 'brightness': 2})

        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .opacity(0.3)
        .fadeOut(10000, {'ease': 'easeOutQuint'})
        .belowTokens()
        .scaleToObject(3)
        .duration(20000)

        .effect()
        .file('jb2a.particles.outward.blue.01.03')
        .atLocation(selected)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .scaleToObject(5)
        .duration(10000);

        await teleOut.play();
    let selection2 = await chris.remoteDialog(workflow.item.name, constants.yesNo, gmID, 'Select destination?');
    if (!selection2) {
        let options = {
            'permanent': true,
            'name': workflow.item.name,
            'description': workflow.item.name
        };
        let updates = {
            'token': {
                'hidden': true,
                'alpha': 1
            }
        };
        for (let token of targetTokens) await warpgate.mutate(token, updates, {}, options);
        queue.remove(workflow.item.uuid);
        return;
    }
    let interval = selected.document.width % 2 === 0 ? 1 : -1;
    let position = await chris.remoteAimCrosshair(selected, false, workflow.item.img, interval, selected.document.width + 2, gmID);
    if (position.cancelled) {
        await workflow.actor.sheet.maximize();
        queue.remove(workflow.item.uuid);
        return;
    }
    let originX = selected.center.x;
    let originY = selected.center.y; 
    let teleIn = new Sequence()
        .animation()
        .on(selected)
        .teleportTo(position)
        .snapToGrid()
        .offset({'x': -1, 'y': -1 })
        .waitUntilFinished(1000)
        
        .thenDo(function() {
            targetTokens.filter(i => i.uuid != selected.document.uuid).forEach(target => {
                let targetX = position.x + target.object.center.x - originX;
                let targetY = position.y + target.object.center.y - originY;
                new Sequence()
                    .animation()
                    .on(target)
                    .teleportTo({'x': targetX, 'y': targetY})
                    .snapToGrid()
                    .offset({'x': -1, 'y': -1 })
                    .waitUntilFinished(1000)
                    .play();
                })
            }
        )

        .effect()
        .from(selected)
        .atLocation(selected)
        .scaleToObject(1.1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
        .filter('Blur', {'blurX': 5, 'blurY': 10 })
        .animateProperty('spriteContainer', 'position.y', {'from': -1000, 'to': 0, 'duration': 500, 'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'scale.x', {'from': 0.5, 'to': 0, 'duration': 500, 'ease': 'easeOutElastic'})
        .fadeOut(100)
        .scaleOut(0, 100, {'ease': 'easeOutCubic'})
        .duration(500)
        .attachTo(selected, {'bindAlpha': false})
        .waitUntilFinished(-300)
        
        .effect()
        .file('modules/animated-spell-effects-cartoon/spell-effects/cartoon/energy/energy_pulse_yellow_CIRCLE.webm')
        .atLocation(selected)
        .opacity(1)
        .scaleToObject(4)
        .filter('ColorMatrix', {'saturate':-1, 'hue': 160,'brightness': 2})
        
        .effect()
        .file('jb2a.particles.outward.blue.01.03')
        .atLocation(selected)
        .fadeIn(250, {'ease': 'easeOutQuint'})
        .scaleIn(0, 200, {'ease': 'easeOutCubic'})
        .fadeOut(5000, {'ease': 'easeOutQuint'})
        .opacity(1)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .scaleToObject(5)
        .duration(10000)
        
        .effect()
        .from(selected)
        .atLocation(selected)
        .scaleToObject(1.1)
        .fadeOut(1000, {'ease': 'easeInExpo'})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
        .filter('Blur', {'blurX': 5, 'blurY': 10 })
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .duration(1200)
        .attachTo(selected, {'bindAlpha': false})
        
        .animation()
        .on(selected)
        .opacity(1.0)
        .show()
        
        .thenDo(function() {
            targetTokens.forEach(target => {  
                new Sequence()
                    .effect()
                    .from(target)
                    .atLocation(target)
                    .scaleToObject(1.1)
                    .fadeOut(1000, {'ease': 'easeInExpo'})
                    .filter('ColorMatrix', {'saturate': -1, 'brightness': 10})
                    .filter('Blur', {'blurX': 5, 'blurY': 10 })
                    .scaleIn(0, 500, {'ease': 'easeOutCubic'})
                    .duration(1200)
                    .attachTo(target, {'bindAlpha': false})
                    
                    .animation()
                    .on(target)
                    .opacity(1.0)
                    .show()
                    .play();
                })
            }
        )
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -0.5, 'brightness': 1.5})
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(3)
        .fadeOut(4000)
        .duration(5000)
        .waitUntilFinished(-4000)
        
        .effect()
        .file('jb2a.magic_signs.circle.02.conjuration.loop.blue')
        .atLocation(selected)
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .opacity(0.3)
        .fadeOut(10000, {'ease': 'easeOutQuint'})
        .belowTokens()
        .scaleToObject(3)
        .duration(20000);

        await teleIn.play();
        await workflow.actor.sheet.maximize();
        queue.remove(workflow.item.uuid);
}