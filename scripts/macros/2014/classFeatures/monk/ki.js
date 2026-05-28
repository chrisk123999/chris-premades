import {animationUtils, crosshairUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
import {dash} from '../../actions/dash.js';
import {disengage} from '../../actions/disengage.js';
async function flurryOfBlows({trigger, workflow}) {
    if (!itemUtils.getConfig(workflow.item, 'promptForTargets')) return;
    let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'monkUnarmedStrike') ?? itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
    if (!unarmedStrike) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let target;
    let nearby;
    if (workflow.targets.size) {
        target = workflow.targets.first();
    } else {
        nearby = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: true});
        if (!nearby.length) return;
        if (nearby.length === 1) {
            target = nearby[0];
        } else {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
            if (!selection) return;
            target = selection[0].object;
        }
    }
    let attacks = itemUtils.getConfig(workflow.item, 'attacks');
    let animationTargets = new Set();
    while (attacks) {
        await workflowUtils.specialItemUse(unarmedStrike, [target], workflow.item);
        animationTargets.add(target);
        attacks--;
        if (attacks) {
            nearby = tokenUtils.findNearby(workflow.token, 5, 'enemy', {includeIncapacitated: true});
            if (!nearby.length) break;
            if (nearby.length === 1) {
                target = nearby[0];
            } else {
                let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
                if (!selection) break;
                target = selection[0];
            }
        }
    }
    if (!playAnimation) return;
    animationTargets.forEach(target => {
        /* eslint-disable indent */
        new Sequence()
            .effect()
                .copySprite(workflow.token)
                .attachTo(workflow.token)
                .size(workflow.token.document.width * workflow.token.document.texture.scaleX, {gridUnits: true})
                .fadeOut(150)
                .duration(1800)
                .zIndex(2)
            .effect()
                .delay(150)
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .atLocation(workflow.token)
                .stretchTo(target.center, {randomOffset: 0.2})
                .scale(0.6 * workflow.token.document.width)
                .playbackRate(1)
                .startTime(300)
                .endTime(600)
                .opacity(1)
                .rotate(0)
                .mirrorX(false)
                .repeats(3, 300, 300)
                .randomizeMirrorY()
                .spriteOffset({x: workflow.token.document.width * 0.25}, {gridUnits: true})
                .zIndex(1.1)
                .wait(300)
            .effect()
                .file('jb2a.impact.009.orange')
                .atLocation(target, {randomOffset: 1})
                .size(workflow.token.document.width * 1.25, {gridUnits: true})
                .repeats(20, 50, 50)
                .randomRotation()
            .effect()
                .copySprite(target)
                .atLocation(target)
                .fadeIn(200)
                .fadeOut(200)
                .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(target.document.texture.scaleX)
                .duration(1400)
                .opacity(0.25)
            .play();
        /* eslint-enable indent */
    });
}async function stepOfTheWind({trigger, workflow}) {
    if (!workflow.token) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() != 'patreon' || !animationUtils.aseCheck()) return;
    let displayHint = itemUtils.getConfig(workflow.item, 'displayHint');
    if (displayHint) genericUtils.notify('CHRISPREMADES.Macros.Dash.Notify', 'info', {localize: true});
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let fade = animation === 'cunningAction' ? 'jb2a.particles.outward.purple.01.03' : 'jb2a.particles.outward.blue.01.03';
    await workflow.actor.sheet.minimize();
    let positions = [];
    let i = 0;
    let cancelled = false;
    while (!cancelled) {
        positions[i] = await crosshairUtils.aimCrosshair({
            token: workflow.token, 
            maxRange: workflow.actor.system.attributes.movement.walk, 
            centerpoint: workflow.token.center, 
            drawBoundries: true, 
            trackDistance: true, 
            fudgeDistance: workflow.token.document.width * canvas.dimensions.distance / 2,
            crosshairsConfig: {
                size: workflow.token.document.parent.grid.distance * workflow.token.document.width / 2,
                icon: workflow.token.document.texture.src,
                resolution: (workflow.token.document.width % 2) ? 1 : -1
            }
        });
        if (positions[i].cancelled) {
            positions.push(positions[i]);
            i++;
            /* eslint-disable indent */
                new Sequence()
                    .effect()
                        .name('Dash Crosshair')
                        .copySprite(workflow.token)
                        .atLocation(positions[i])
                        .fadeIn(100)
                        .persist()
                        .opacity(0.65)
                        .locally()
                        .loopProperty('alphaFilter', 'alpha', {from: 1, to: 0.75, duration: 1500, pingPong: true})
                        .filter('ColorMatrix', {saturate: -1, brightness: 0.5})
                        .scale(workflow.token.document.texture.scaleX)
                        .fadeIn(250)
                        .fadeOut(500)
                        .waitUntilFinished(-500)
                    .effect()
                        .file(fade)
                        .atLocation(positions[i])
                        .scale(0.15 * workflow.token.document.texture.scaleX)
                        .duration(1000)
                        .fadeOut(500)
                        .scaleIn(0, 1000, {ease: 'easeOutCubic'})
                        .filter('ColorMatrix', {hue: 0})
                        .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 500, gridUnits: true, ease:'easeOutBack'})
                        .animateProperty('sprite', 'height', {from: 0, to: 1.5, duration: 1000, gridUnits: true, ease:'easeOutBack'})
                        .animateProperty('sprite', 'position.y', {from: 0, to: -1, duration: 1000, gridUnits: true})
                        .zIndex(0.2)
                        .filter('ColorMatrix', {saturate: -1, brightness: 0})
                        .locally()
                    .play();
                /* eslint-enable indent */
        } else { 
            cancelled = true;
        }
    }
    Sequencer.EffectManager.endEffects({name: 'Dash Crosshair'});
    await genericUtils.sleep(500);
    if (animation === 'cunningAction') {
        await dash.utilFunctions.cunningAction(workflow.token, positions);
    } else {
        await disengage.utilFunctions.stepOfTheWind(workflow.token, positions);
    }
}
export let ki = {
    name: 'Ki Points',
    aliases: ['Ki'],
    version: '1.5.35',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: flurryOfBlows,
                priority: 50,
                activities: ['flurryOfBlows']
            },
            {
                pass: 'rollFinished',
                macro: stepOfTheWind,
                priority: 50,
                activities: ['stepOfTheWindDash']
            }
        ]
    },
    config: [
        {
            value: 'attacks',
            label: 'CHRISPREMADES.Config.Attacks',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'promptForTargets',
            label: 'CHRISPREMADES.Generic.PromptForTargets',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        },
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
            default: 'stepOfTheWind',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    hasAnimation: true
};
