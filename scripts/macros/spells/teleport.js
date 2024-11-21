import {socket, sockets} from '../../lib/sockets.js';
import {activityUtils, animationUtils, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let targets = tokenUtils.findNearby(workflow.token, 10, 'ally', {includeIncapacitated: true});
    let toTeleport = [workflow.token];
    if (workflow.actor.sheet.rendered) workflow.actor.sheet.minimize();
    if (targets.length) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Teleport.Select', targets, {skipDeadAndUnconscious: false, type: 'multiple', maxAmount: 8});
        if (selection && selection[0]?.length) {
            toTeleport.push(...selection[0]);
        }
    }
    let buttons = [
        ['CHRISPREMADES.Macros.Teleport.PermanentCircle', 'pc'],
        ['CHRISPREMADES.Macros.Teleport.AssociatedObject', 'ao'],
        ['CHRISPREMADES.Macros.Teleport.VeryFamiliar', 'vf'],
        ['CHRISPREMADES.Macros.Teleport.SeenCasually', 'sc'],
        ['CHRISPREMADES.Macros.Teleport.ViewedOnce', 'vo'],
        ['CHRISPREMADES.Macros.Teleport.Description', 'd'],
        ['CHRISPREMADES.Macros.Teleport.FalseDestination', 'fd']
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Teleport.Familiarity', buttons, {userId: socketUtils.gmID()});
    if (!selection) {
        if (workflow.actor.sheet.rendered) workflow.actor.sheet.maximize();
        return;
    }
    let flavors = {
        mishap: 'CHRISPREMADES.Macros.Teleport.Mishap',
        onTarget: 'CHRISPREMADES.Macros.Teleport.OnTarget',
        offTarget: 'CHRISPREMADES.Macros.Teleport.OffTarget',
        similarArea: 'CHRISPREMADES.Macros.Teleport.SimilarArea',
    };
    let flavor = 'mishap';
    let totalDamage = 0;
    while (flavor === 'mishap') {
        if (totalDamage > 0) await genericUtils.sleep(100);
        let roll = await new Roll('1d100').evaluate();
        let total = Math.clamp(roll.total, 0, 100);
        switch (selection) {
            case 'pc':
            case 'ao':
                flavor = 'onTarget';
                break;
            case 'vf':
                if (total < 6) {
                    flavor = 'mishap';
                    totalDamage += 3;
                } else if (total < 14) {
                    flavor = 'similarArea';
                } else if (total < 25) {
                    flavor = 'offTarget';
                } else {
                    flavor = 'onTarget';
                }
                break;
            case 'sc':
                if (total < 34) {
                    flavor = 'mishap';
                    totalDamage += 3;
                } else if (total < 44) {
                    flavor = 'similarArea';
                } else if (total < 54) {
                    flavor = 'offTarget';
                } else {
                    flavor = 'onTarget';
                }
                break;
            case 'vo':
            case 'd':
                if (total < 44) {
                    flavor = 'mishap';
                    totalDamage += 3;
                } else if (total < 54) {
                    flavor = 'similarArea';
                } else if (total < 74) {
                    flavor = 'offTarget';
                } else {
                    flavor = 'onTarget';
                }
                break;
            case 'fd':
            default:
                if (total < 51) {
                    flavor = 'mishap';
                    totalDamage += 3;
                } else {
                    flavor = 'similarArea';
                }
        }
        roll.toMessage({
            rollMode: 'roll',
            speaker: workflow.chatCard.speaker,
            flavor: genericUtils.translate(flavors[flavor]),
            whisper: [socketUtils.gmID()]
        }, {
            rollMode: CONST.DICE_ROLL_MODES.BLIND
        });
    }
    if (totalDamage > 0) {
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'teleportDamage', {strict: true});
        if (!feature) {
            if (workflow.actor.sheet.rendered) workflow.actor.sheet.maximize();
            return;
        }
        await activityUtils.setDamage(feature, totalDamage + 'd10[force]', ['force']);
        await workflowUtils.syntheticActivityRoll(feature, toTeleport);
    }
    if (flavor === 'offTarget') {
        let roll = await new Roll('1d10 * 1d10').evaluate();
        roll.toMessage({
            rollMode: 'roll',
            speaker: workflow.chatCard.speaker,
            flavor: genericUtils.translate('CHRISPREMADES.Macros.Teleport.Distance'),
            whisper: [socketUtils.gmID()]
        }, {
            rollMode: CONST.DICE_ROLL_MODES.BLIND
        });
        let roll2 = await new Roll('1d8').evaluate();
        roll.toMessage({
            rollMode: 'roll',
            speaker: workflow.chatCard.speaker,
            flavor: genericUtils.translate('CHRISPREMADES.Macros.Teleport.Direction'),
            whisper: [socketUtils.gmID()]
        }, {
            rollMode: CONST.DICE_ROLL_MODES.BLIND
        });
        let inputs = [
            ['number', 
                [
                    {
                        label: 'CHRISPREMADES.Generic.Distance', 
                        name: 'distance'
                    }
                ]
            ],
            ['selectOption', 
                [
                    {
                        label: 'CHRISPREMADES.Units.Units', 
                        name: 'units',
                        options: {
                            options: [
                                {
                                    value: 'miles', 
                                    label: 'CHRISPREMADES.Units.Miles'
                                },
                                {
                                    value: 'feet', 
                                    label: 'CHRISPREMADES.Units.Feet'
                                }
                            ]
                        }
                    }
                ]
            ]
        ];
        let location = await socket.executeAsGM(sockets.dialog.name, workflow.item.name, 'CHRISPREMADES.Macros.Teleport.HowFar', inputs, 'okCancel');
        if (!location || !location.buttons) {
            if (workflow.actor.sheet.rendered) workflow.actor.sheet.maximize();
        }
        let distance = Math.floor((roll.total / 100) * location.distance);
        let directions = [
            genericUtils.translate('CHRISPREMADES.Direction.North'),
            genericUtils.translate('CHRISPREMADES.Direction.Northeast'),
            genericUtils.translate('CHRISPREMADES.Direction.East'),
            genericUtils.translate('CHRISPREMADES.Direction.Southeast'),
            genericUtils.translate('CHRISPREMADES.Direction.South'),
            genericUtils.translate('CHRISPREMADES.Direction.Southwest'),
            genericUtils.translate('CHRISPREMADES.Direction.West'),
            genericUtils.translate('CHRISPREMADES.Direction.Northwest'),
        ];
        ChatMessage.create({
            speaker: workflow.chatCard.speaker,
            content: genericUtils.format('CHRISPREMADES.Macros.Teleport.OffTargetString', {distance, units: genericUtils.translate(location.units === 'miles' ? 'CHRISPREMADES.Units.Miles' : 'CHRISPREMADES.Units.Feet').toLowerCase(), direction: directions[roll2.total - 1]}),
            whisper: [socketUtils.gmID()],
            blind: true
        });
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
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
            toTeleport.filter(i => i.uuid != selected.document.uuid).forEach(target => {  
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
            });
        })

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

    if (playAnimation) await teleOut.play();
    let selection2 = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.Teleport.SelectDestination', {userId: socketUtils.gmID()});
    if (!selection2) {
        for (let token of toTeleport) {
            await genericUtils.update(token.document, {hidden: true, alpha: 1});
        }
        if (workflow.actor.sheet.rendered) workflow.actor.sheet.maximize();
        return;
    }
    let maxDim = Math.max(canvas.dimensions.width, canvas.dimensions.height);
    let range = canvas.dimensions.distance * Math.floor(maxDim / canvas.dimensions.size);
    await socket.executeAsGM(sockets.teleport.name, toTeleport.map(i => i.document.uuid), workflow.token.document.uuid, {range, animation: 'none', minimizeSheet: false});
    let teleIn = new Sequence()
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
            toTeleport.forEach(target => {  
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
            });
        })

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

    if (playAnimation) await teleIn.play();
    if (workflow.actor.sheet.rendered) workflow.actor.sheet.maximize();
}
export let teleport = {
    name: 'Teleport',
    version: '1.1.0',
    hasAnimation: true,
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
        }
    ]
};