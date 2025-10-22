import {Teleport} from '../../../../lib/teleport.js';
import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let seasonItem = itemUtils.getItemByIdentifier(workflow.actor, 'changeSeason');
    let playComplex = itemUtils.getConfig(workflow.item, 'animation') === 'complex' && animationUtils.jb2aCheck() === 'patreon';
    let animation = (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck()) ? 'mistyStep' : 'none';
    if (seasonItem) {
        let currSeason = seasonItem.flags['chris-premades']?.eladrin?.season ?? 'autumn';
        let feature;
        if (workflow.actor.system.details.level >= 3) {
            feature = await activityUtils.getActivityByIdentifier(workflow.item, 'feyStep' + currSeason.capitalize(), {strict: true});
            if (!feature) return;
        }
        switch (currSeason) {
            case 'autumn': {
                if (playComplex) {
                    await combinedAnimation('autumn', workflow.token, workflow.token, [], feature);
                } else {
                    await Teleport.target(workflow.token, workflow.token, {
                        animation,
                        range: 30
                    });
                    if (!feature) return;
                    let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                    if (!nearbyTargets.length) return;
                    if (nearbyTargets.length > 2) {
                        nearbyTargets = await dialogUtils.selectTargetDialog(feature.name, genericUtils.format('CHRISPREMADES.Macros.FeyStep.SelectAutumn', {max: 2}), nearbyTargets, {
                            type: 'multiple',
                            maxAmount: 2
                        });
                        if (!nearbyTargets?.length) return;
                        nearbyTargets = nearbyTargets[0];
                    }
                    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, nearbyTargets);
                    if (!featureWorkflow.failedSaves.size) return;
                    let effectData = {
                        name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Charmed'),
                        img: feature.img,
                        duration: {
                            seconds: 60
                        },
                        origin: workflow.item.uuid,
                        flags: {
                            'chris-premades': {
                                conditions: ['charmed']
                            },
                            dae: {
                                specialDuration: ['isDamaged']
                            }
                        }
                    };
                    for (let token of featureWorkflow.failedSaves) {
                        await effectUtils.createEffect(token.actor, effectData);
                    }
                }
                return;
            }
            case 'winter': {
                if (!feature) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => tokenUtils.canSee(workflow.token, i));
                let targetToken = nearbyTargets[0];
                if (nearbyTargets.length > 1) {
                    targetToken = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.FeyStep.SelectWinter', nearbyTargets);
                    if (targetToken) targetToken = targetToken[0];
                }
                let featureWorkflow;
                if (targetToken) featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
                if (playComplex) {
                    await combinedAnimation('winter', workflow.token, workflow.token, targetToken ? [targetToken]: []);
                } else {
                    await Teleport.target(workflow.token, workflow.token, {
                        animation,
                        range: 30
                    });
                }
                if (!featureWorkflow?.failedSaves.size) return;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Frightened'),
                    img: feature.img,
                    origin: workflow.item.uuid,
                    flags: {
                        'chris-premades': {
                            conditions: ['frightened']
                        },
                        dae: {
                            showIcon: true,
                            specialDuration: ['turnEndSource']
                        }
                    }
                };
                await effectUtils.createEffect(targetToken.actor, effectData);
                return;
            }
            case 'spring': {
                if (!feature) break;
                let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally', {includeIncapacitated: false, includeToken: true});
                let selection = nearbyTargets;
                if (selection.length > 1) selection = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.FeyStep.SelectSpring', nearbyTargets);
                if (!selection) selection = [workflow.token];
                selection = selection[0];
                await workflowUtils.syntheticActivityRoll(feature, [selection]);
                if (playComplex) {
                    await combinedAnimation('spring', workflow.token, selection, []);
                } else {
                    await Teleport.target(workflow.token, workflow.token, {
                        animation,
                        range: 30
                    });
                }
                return;
            }
            case 'summer': {
                if (playComplex) {
                    await combinedAnimation('summer', workflow.token, workflow.token, [], feature);
                } else {
                    await Teleport.target(workflow.token, workflow.token, {
                        animation,
                        range: 30
                    });
                    await workflowUtils.syntheticActivityRoll(feature);
                }
                return;
            }
        }
    }
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: 30
    });
}

async function combinedAnimation(season, sourceToken, teleToken, targetTokens, feature) {
    let hue, leaves, saturate;
    if (season === 'autumn') {
        hue = -15;
        leaves = 'orangered';
        saturate = 0;
    } else if (season === 'winter') {
        hue = 140;
        leaves = 'pink';
        saturate = -1;
    } else if (season === 'spring') {
        hue = 35;
        leaves = 'green';
        saturate = 0;
    } else if (season === 'summer') {
        hue = -0;
        leaves = 'greenorange';
        saturate = 0;
    }
    // Animations by: eskiemoh
    await new Sequence()
        //Spring Sequence
        .thenDo(function () {
            if (season === 'spring') {
                new Sequence()

                    .effect()
                    .file('jb2a.markers.light_orb.complete.yellow')
                    .atLocation(sourceToken)
                    .scale(0.25)
                    .rotateTowards(teleToken)
                    .playbackRate(1.5)
                    .duration(3100)
                    .scaleOut(0, 1000, {ease: 'easeOutCubic'})
                    .spriteOffset(
                        {x: -0.1 + (sourceToken.document.width - 1) / 2},
                        {gridUnits: true}
                    )
                    .filter('ColorMatrix', {hue})

                    .effect()
                    .file('jb2a.swirling_leaves.loop.01.green.0')
                    .atLocation(sourceToken)
                    .scale(0.25)
                    .rotateTowards(teleToken)
                    .playbackRate(1.5)
                    .duration(3100)
                    .scaleIn(0, 500, {ease: 'easeInCubic'})
                    .scaleOut(0, 1000, {ease: 'easeOutCubic'})
                    .spriteOffset(
                        {x: -0.1 + (sourceToken.document.width - 1) / 2},
                        {gridUnits: true}
                    )
                    .zIndex(1)

                    .effect()
                    .delay(2000)
                    .file('jb2a.impact.010.green')
                    .atLocation(sourceToken)
                    .scale(0.25)
                    .rotateTowards(teleToken)
                    .spriteOffset(
                        {x: -0.1 + (sourceToken.document.width - 1) / 2},
                        {gridUnits: true}
                    )
                    .zIndex(2)

                    .play();
            }
        })

        .effect()
        .file(`jb2a.swirling_leaves.complete.02.${leaves}`)
        .atLocation(teleToken)
        .scaleToObject(2.25)
        .playbackRate(2)
        .zIndex(2)
        .belowTokens()
        .filter('ColorMatrix', {saturate})

        .wait(1250)

        .animation()
        .delay(800)
        .on(teleToken)
        .fadeOut(200)

        .effect()
        .delay(600)
        .file('jb2a.impact.frost.blue.01')
        .atLocation(teleToken)
        .size(3, {gridUnits: true})
        .belowTokens()
        .opacity(0.5)
        .playIf(() => {
            return season === 'winter';
        })

        //Winter Sequence
        .thenDo(function () {
            if (season === 'winter' && targetTokens.length) {
                new Sequence()

                    .wait(600)

                    .effect()
                    .file('jb2a.toll_the_dead.yellow.skull_smoke')
                    .atLocation(targetTokens[0])
                    .scaleToObject(1.5)
                    .filter('ColorMatrix', {hue})
                    .opacity(0.8)

                    .effect()
                    .delay(200)
                    .copySprite(targetTokens[0])
                    .attachTo(targetTokens[0])
                    .fadeIn(200)
                    .fadeOut(7500)
                    .loopProperty('sprite', 'position.x', {
                        from: -0.02,
                        to: 0.02,
                        duration: 50,
                        pingPong: true,
                        gridUnits: true,
                    })
                    .scaleToObject(targetTokens[0].document.texture.scaleX)
                    .duration(8000)
                    .opacity(0.25)

                    .effect()
                    .file('jb2a.extras.tmfx.border.circle.outpulse.01.normal')
                    .atLocation(targetTokens[0])
                    .scaleToObject(targetTokens[0].document.texture.scaleX * 1.25)
                    .opacity(0.4)

                    .play();
            }
        })

        .effect()
        .file('jb2a.misty_step.01.yellow')
        .atLocation(teleToken)
        .scaleToObject(1.5)
        .filter('ColorMatrix', {hue})
        .opacity(0.8)
        .waitUntilFinished(-2000)
        
        .thenDo(async function() {
            await Teleport.target(teleToken, sourceToken, {
                animation: 'none',
                range: 30
            });
            if (season === 'summer') {
                let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature);
                targetTokens = Array.from(featureWorkflow.targets);
            } else if (season === 'autumn') {
                let nearbyTargets = tokenUtils.findNearby(sourceToken, 10, 'enemy').filter(i => tokenUtils.canSee(sourceToken, i));
                if (!nearbyTargets.length) return;
                if (nearbyTargets.length > 2) {
                    nearbyTargets = await dialogUtils.selectTargetDialog(feature.name, genericUtils.format('CHRISPREMADES.Macros.FeyStep.SelectAutumn', {max: 2}), nearbyTargets, {
                        type: 'multiple',
                        maxAmount: 2
                    });
                    if (!nearbyTargets?.length) return;
                    nearbyTargets = nearbyTargets[0];
                }
                targetTokens = nearbyTargets ?? [];
                let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, nearbyTargets);
                if (!featureWorkflow.failedSaves.size) return;
                let effectData = {
                    name: genericUtils.translate('CHRISPREMADES.Macros.FeyStep.Charmed'),
                    img: feature.img,
                    duration: {
                        seconds: 60
                    },
                    origin: feature.item.uuid,
                    flags: {
                        'chris-premades': {
                            conditions: ['charmed']
                        },
                        dae: {
                            specialDuration: ['isDamaged']
                        }
                    }
                };
                for (let token of featureWorkflow.failedSaves) {
                    await effectUtils.createEffect(token.actor, effectData);
                }
            }
        })
        .waitUntilFinished(100)

        .effect()
        .file(`jb2a.swirling_leaves.complete.02.${leaves}`)
        .atLocation(teleToken)
        .scaleToObject(2.25)
        .fadeOut(300)
        .filter('ColorMatrix', {saturate})
        .animateProperty('sprite', 'width', {
            from: teleToken.document.width * 2.25,
            to: 0,
            duration: 1500,
            ease: 'easeInQuint',
            gridUnits: true,
            delay: 500,
        })
        .animateProperty('sprite', 'height', {
            from: teleToken.document.width * 2.25,
            to: 0,
            duration: 1500,
            ease: 'easeInQuint',
            gridUnits: true,
            delay: 500,
        })
        .animateProperty('sprite', 'width', {
            from: 0,
            to: teleToken.document.width * 2.25,
            duration: 500,
            ease: 'easeOutCubic',
            gridUnits: true,
            delay: 2500,
        })
        .animateProperty('sprite', 'height', {
            from: 0,
            to: teleToken.document.width * 2.25,
            duration: 500,
            ease: 'easeOutCubic',
            gridUnits: true,
            delay: 2500,
        })
        .playbackRate(2)
        .belowTokens()

        .wait(1000)

        .effect()
        .file('jb2a.misty_step.02.yellow')
        .atLocation(teleToken)
        .filter('ColorMatrix', {hue})
        .opacity(0.8)
        .scaleToObject(1.5)

        .animation()
        .delay(1400)
        .on(teleToken)
        .fadeIn(200)
        .waitUntilFinished(-750)

        .effect()
        .file('jb2a.cast_generic.fire.01.orange')
        .atLocation(teleToken)
        .startTime(500)
        .size(4.5, {gridUnits: true})
        .scaleIn(0, 500, {ease: 'easeOutCubic'})
        .belowTokens()
        .playIf(() => {
            return season === 'summer';
        })

        .effect()
        .file('jb2a.swirling_leaves.outburst.01.pink')
        .atLocation(teleToken)
        .size(2.75, {gridUnits: true})
        .filter('ColorMatrix', {hue: 100})
        .zIndex(1)
        .playIf(() => {
            return season === 'summer';
        })

        //Autumn Sequence
        .thenDo(function () {
            if (season === 'autumn') {
                targetTokens.forEach((atmTarget) => {
                    new Sequence()

                        .effect()
                        .file('jb2a.misty_step.02.yellow')
                        .atLocation(atmTarget)
                        .scaleToObject(1.5)
                        .filter('ColorMatrix', {hue})
                        .startTime(1200)
                        .opacity(0.8)

                        .wait(250)

                        .effect()
                        .file('jb2a.swirling_leaves.complete.01.orangered.1')
                        .attachTo(atmTarget, {offset: {y: 0.05}, gridUnits: true})
                        .scaleToObject(teleToken.document.texture.scaleX * 1.15, {
                            considerTokenScale: true,
                        })
                        .duration(6750)
                        .playbackRate(1.5)
                        .zIndex(0)

                        .effect()
                        .file('jb2a.icon.heart.pink')
                        .attachTo(atmTarget, {offset: {y: 0.05}, gridUnits: true})
                        .scaleToObject(1 * 0.7, {considerTokenScale: true})
                        .fadeIn(250)
                        .scaleIn(0, 250, {ease: 'easeOutCubic'})
                        .duration(6000)
                        .fadeOut(500)
                        .filter('ColorMatrix', {hue: 100})

                        .effect()
                        .from(atmTarget)
                        .attachTo(atmTarget)
                        .fadeIn(500)
                        .fadeOut(500)
                        .scaleToObject(atmTarget.document.texture.scaleX)
                        .tint('#f4aa0b')
                        .opacity(0.5)

                        .wait(2000)

                        .play();
                });
            }
        })

        //Summer Sequence
        .thenDo(function () {
            if (season === 'summer') {
                targetTokens.forEach((sumTarget) => {
                    new Sequence()

                        .effect()
                        .delay(200)
                        .from(sumTarget)
                        .attachTo(sumTarget)
                        .fadeIn(200)
                        .fadeOut(2500)
                        .loopProperty('sprite', 'position.x', {
                            from: -0.05,
                            to: 0.05,
                            duration: 70,
                            pingPong: true,
                            gridUnits: true,
                        })
                        .scaleToObject(1, {considerTokenScale: true})
                        .tint('#f5e10a')
                        .duration(3000)
                        .opacity(0.5)

                        .play();
                });
            }
        })

        .play();
}
export let eladrinFeyStep = {
    name: 'Fey Step',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['eladrinFeyStep']
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
            category: 'animation',
            options: [
                {
                    value: 'simple',
                    label: 'CHRISPREMADES.Config.Animations.Simple'
                },
                {
                    value: 'complex',
                    label: 'CHRISPREMADES.Config.Animations.Complex',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        }
    ]
};