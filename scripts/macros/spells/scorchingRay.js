import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function scorchingRay({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let maxRays = 3 + (workflow.castData.castLevel - 2);
    let skipDead = false;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Scorching Ray Bolt', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Scorching Ray Bolt');
    featureData.system.ability = workflow.item.system.ability;
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': workflow.castData
        }
    }
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    if (workflow.item.flags?.['chris-premades']?.attackRoll?.enabled) setProperty(featureData, 'flags.chris-premades.attackRoll', {'enabled': true, 'value': workflow.item.flags?.['chris-premades']?.attackRoll?.value});
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions([]);
    let animation = chris.jb2aCheck() === 'patreon' ? chris.getConfiguration(workflow.item, 'animation') ?? 'complex' : 'simple';
    let color = chris.jb2aCheck() === 'patreon' ? chris.getConfiguration(workflow.item, 'color') ?? 'orange' : 'orange';
    let particle = 'jb2a.particles.outward.orange.01.03';
    if (animation === 'complex') {
        //Animations by: eskiemoh
        if (color === 'cycle' || color === 'random') await Sequencer.Preloader.preload('jb2a.scorching_ray');
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

            .play()
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'scorchingRay', 50);
    if (!queueSetup) return;
    let colors = [
        'orange',
        'blue',
        'green',
        'pink',
        'purple',
    ];
    let lastColor;
    if (color === 'random' || color === 'cycle') {
        lastColor = Math.floor(Math.random() * colors.length);
    }
    while (maxRays > 0) {
        let nearbyTargets = chris.findNearby(workflow.token, workflow.item.system.range.value, 'enemy', true);
        let targets = skipDead ? nearbyTargets.filter(i => i.actor.system.attributes.hp.value > 0) : nearbyTargets;
        let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, targets, true, 'number', null, true, 'Select your targets (max: ' + maxRays + '):');
        if (!selection.buttons) {
            queue.remove(workflow.item.uuid);
            await Sequencer.EffectManager.endEffects({'name': 'Scorching Ray', 'object': workflow.token});
            return;
        }
        let total = 0;
        for (let i = 0; i < (selection.inputs.length - 1); i++) {
            if (!isNaN(selection.inputs[i])) total += selection.inputs[i];
        }
        if (total > maxRays) {
            ui.notifications.info('You can\'t use that many rays!');
            continue;
        }
        skipDead = selection.inputs[selection.inputs.length - 1];
        for (let i = 0; i < selection.inputs.length - 1; i++) {
            let target = fromUuidSync(targets[i].document.uuid).object;
            if (isNaN(selection.inputs[i]) || selection.inputs[i] === 0) continue;
            if (skipDead) {
                if (target.actor?.system?.attributes?.hp?.value === 0) continue;
            }
            options.targetUuids = [target.document.uuid];
            let rayCount = 0;
            for (let j = 0; j < selection.inputs[i]; j++) {
                await warpgate.wait(100);
                maxRays -= 1;
                let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
                rayCount += 1;
                if (animation === 'simple') {
                    new Sequence()
                        .effect()
                        .file('jb2a.scorching_ray.01.' + color)
                        .atLocation(workflow.token)
                        .stretchTo(target)
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
                    let targetCenter = target.center;
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
                    .stretchTo(target, {'randomOffset': 0.75})
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
                    .from(target)
                    .attachTo(target)
                    .fadeIn(200)
                    .fadeOut(500)
                    .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true})
                    .scaleToObject(target.document.texture.scaleX)
                    .duration(1800)
                    .opacity(0.25)
                    .tint('#fb8b23')
                    
                    .effect()
                    .delay(200,500)
                    .file(particle)
                    .attachTo(target, {'randomOffset': 0.2})
                    .zIndex(1)
                    .fadeIn(500)
                    .fadeOut(1200)
                    .duration(4500)
                    .scaleToObject(1.5)
                    .randomRotation()
                    
                    .play()
                }
            }
        }
    }
    queue.remove(workflow.item.uuid);
    if (animation === 'complex') {
        await warpgate.wait(1500);
        await Sequencer.EffectManager.endEffects({'name': 'Scorching Ray', 'object': workflow.token});
    }
}