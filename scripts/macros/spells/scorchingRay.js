import {animationUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let maxRays = 1 + workflow.castData.castLevel;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Scorching Ray Bolt', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ScorchingRay.Bolt', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.ability = workflow.item.system.ability;
    let jb2a = animationUtils.jb2aCheck();
    let shouldPlayAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && jb2a;
    let animation = jb2a === 'patreon' ? itemUtils.getConfig(workflow.item, 'animation') : 'simple';
    let color = itemUtils.getConfig(workflow.item, 'color');
    let particle = 'jb2a.particles.outward.orange.01.03';
    if (shouldPlayAnimation && animation === 'complex') {
        //Animations by: eskiemoh
        if (color === 'cycle' || color === 'random') await Sequencer.Preloader.preloadForClients('jb2a.scorching_ray');
        await new Sequence()
            .effect()
            .atLocation(workflow.token)
            .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
            .scaleToObject(1.25)
            .rotateIn(180, 600, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {'from': 0, 'to': -360, 'duration': 10000})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)
            .persist()
            .attachTo(workflow.token)
            .name('Scorching Ray')

            .effect()
            .atLocation(workflow.token)
            .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
            .scaleToObject(1.25)
            .rotateIn(180, 600, {'ease': 'easeOutCubic'})
            .scaleIn(0, 600, {'ease': 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {'from': 0, 'to': -360, 'duration': 10000})
            .belowTokens(true)
            .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
            .filter('Blur', {'blurX': 5, 'blurY': 10 })
            .zIndex(1)
            .duration(1200)
            .fadeIn(200, {'ease': 'easeOutCirc', 'delay': 500})
            .fadeOut(300, {'ease': 'linear'})
            .persist()
            .attachTo(workflow.token)
            .name('Scorching Ray')

            .effect()
            .file('jb2a.particles.outward.white.01.02')
            .scaleIn(0, 500, {'ease': 'easeOutQuint'})
            .delay(500)
            .fadeOut(1000)
            .atLocation(workflow.token)
            .duration(1000)
            .size(1.75 * workflow.token.document.width, {'gridUnits': true})
            .animateProperty('spriteContainer', 'position.y', {'from':0 , 'to': -0.5, 'gridUnits': true, 'duration': 1000})
            .zIndex(1)
            .waitUntilFinished(-200)

            .play();
    }
    let colors = ['orange', 'blue', 'green', 'pink', 'purple'];
    let lastColor = Math.floor((Math.random() * colors.length));
    let firstRun = true;
    let skipDead = false;
    while (maxRays > 0) {
        let nearbyTargets;
        let selection;
        if (firstRun && workflow.targets.size) {
            nearbyTargets = Array.from(workflow.targets);
            firstRun = false;
        } else {
            nearbyTargets = tokenUtils.findNearby(workflow.token, workflow.item.system.range.value, 'enemy');
        }
        if (skipDead) nearbyTargets = nearbyTargets.filter(i => i.actor.system.attributes.hp.value > 0);
        let selectionArr = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.ScorchingRay.Select', {maxRays}), nearbyTargets, {
            type: 'selectAmount',
            maxAmount: maxRays
        });
        if (!selectionArr) return;
        [selection, skipDead] = selectionArr;
        for (let {document: targetToken, value: numRays} of selection) {
            if (isNaN(numRays) || numRays == 0) continue;
            if (skipDead && targetToken.actor.system.attributes.hp.value === 0) continue;
            for (let i = 0; i < numRays; i++) {
                let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
                maxRays -= 1;
                if (shouldPlayAnimation) {
                    if (animation === 'simple') {
                        new Sequence()
                            .effect()
                            .file('jb2a.scorching_ray.01.' + color)
                            .atLocation(workflow.token)
                            .stretchTo(targetToken)
                            .missed(!featureWorkflow.hitTargets.size)
                            .play();
                    } else if (animation === 'complex') {
                        let path = 'jb2a.scorching_ray.{{num}}.';
                        if (color === 'random') {
                            path += colors[Math.floor((Math.random() * colors.length))];
                        } else if (color === 'cycle') {
                            path += colors[lastColor];
                            lastColor++;
                            if (lastColor >= colors.length) lastColor = 0;
                        } else {
                            path += color;
                        }
                        let tokenCenter = workflow.token.center;
                        let targetCenter = targetToken.center;
                        let directionVector = {
                            x: targetCenter.x - tokenCenter.x,
                            y: targetCenter.y - tokenCenter.y,
                        };
                        let distance = Math.sqrt(directionVector.x ** 2 + directionVector.y ** 2);
                        let normalizedDirectionVector = {
                            x: directionVector.x / distance,
                            y: directionVector.y / distance,
                        };
                        let magicCircleDistance = canvas.grid.size/3;
                        let magicCircle = {
                            x: tokenCenter.x + normalizedDirectionVector.x * magicCircleDistance,
                            y: tokenCenter.y + normalizedDirectionVector.y * magicCircleDistance,
                        };
                        new Sequence()
                            .wait(150)
                            
                            .effect()
                            .file(path)
                            .atLocation(magicCircle)
                            .scale(0.6)
                            .stretchTo(targetToken, {'randomOffset': 0.75})
                            .setMustache({
                                'num': () => {
                                    let nums = ['01','02', '02'];
                                    if (color === 'rainbow01' || color === 'rainbow02') return '01';
                                    return nums[Math.floor(Math.random()*nums.length)];
                                }
                            })
                            .randomizeMirrorY()
                            .zIndex(1)
                            .missed(!featureWorkflow.hitTargets.size)
                            
                            .effect()
                            .delay(200)
                            .from(targetToken)
                            .attachTo(targetToken)
                            .fadeIn(200)
                            .fadeOut(500)
                            .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true})
                            .scaleToObject(targetToken.document.texture.scaleX)
                            .duration(1800)
                            .opacity(0.25)
                            .tint('#fb8b23')
                            
                            .effect()
                            .delay(200,500)
                            .file(particle)
                            .attachTo(targetToken, {'randomOffset': 0.2})
                            .zIndex(1)
                            .fadeIn(500)
                            .fadeOut(1200)
                            .duration(4500)
                            .scaleToObject(1.5)
                            .randomRotation()
                            .play();
                    }
                }
            }
        }
    }
    if (shouldPlayAnimation && animation === 'complex') {
        await genericUtils.sleep(1500);
        await Sequencer.EffectManager.endEffects({name: 'Scorching Ray', object: workflow.token});
    }
}
export let scorchingRay = {
    name: 'Scorching Ray',
    version: '0.12.26',
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
            default: 'simple',
            category: 'animation',
            options: [
                {
                    value: 'simple',
                    label: 'CHRISPREMADES.Config.Animations.Simple',
                },
                {
                    value: 'complex',
                    label: 'CHRISPREMADES.Config.Animations.Complex',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'orange',
            category: 'animation',
            options: [
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange'
                },
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'pink',
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'cycle',
                    label: 'CHRISPREMADES.Config.Colors.Cycle',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};