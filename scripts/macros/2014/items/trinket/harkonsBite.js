import {activityUtils, actorUtils, animationUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function moonFrenzy(token, {color = 'white', tintMap = false, callback, name = 'Moon Frenzy'} = {}) {
    let tintColor = color === 'red' ? '#d53333' : '#ffffff';
    //Animations by: eskiemoh
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .delay(500)
            .atLocation(token)
            .file('jb2a.celestial_bodies.planet.no_atmo.03.grey')
            .belowTokens()
            .size(2 * 1.5, {gridUnits: true})
            .loopOptions({loops: 1})
            .startTime(13000)
            .duration(13000)
            .opacity(0.275)
            .filter('ColorMatrix', {saturate: -0.25, contrast: 0})
            .tint(tintColor)
            .fadeIn(1500)
            .fadeOut(3000)
            .zIndex(0.1)
        .effect()
            .atLocation(token)
            .file('jb2a.moonbeam.01.complete.yellow')
            .belowTokens()
            .duration(13000)
            .size(2.75 * 1.5, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -0.5})
            .tint(tintColor)
            .opacity(0.1)
        .effect()
            .delay(500)
            .atLocation(token)
            .file('jb2a.extras.tmfx.inflow.circle.01')
            .belowTokens()
            .size(2*1.5, {gridUnits: true})
            .tint(tintColor)
            .opacity(0.2)
            .duration(13000)
            .fadeIn(1500)
            .fadeOut(3000)
            .zIndex(0.2)
        .play();
    new Sequence()
        .wait(3000)
        .effect()
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .atLocation(token)
            .duration(5000)
            .fadeIn(500)
            .scaleIn(0, 750, {ease: 'easeOutSine'})
            .fadeOut(500)
            .scaleToObject(1.5)
            .randomRotation()
            .filter('ColorMatrix', { saturate:-0, brightness:0 })
            .animateProperty('sprite', 'scale.x', {from: 0, to: (token.document.width * 0.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease:'easeOutCubic', delay: 2600})
            .animateProperty('sprite', 'scale.y', { from: 0, to: (token.document.width * 0.25) * token.document.texture.scaleX, duration: 500, gridUnits:true, ease:'easeOutCubic', delay:2600})
            .belowTokens()
        .effect()
            .copySprite(token)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.65)
            .repeats(3, 1200,1200)
        .effect()
            .delay(100)
            .file(token.document.parent.background.src)
            .atLocation({x: token.document.parent.dimensions.width / 2, y: token.document.parent.dimensions.height / 2})
            .size({width: token.document.parent.width / token.document.parent.grid.size, height: token.document.parent.height / token.document.parent.grid.size}, {gridUnits: true})
            .spriteOffset({x: 0}, {gridUnits: true})
            .duration(1200)
            .fadeIn(200)
            .fadeOut(800, {ease: 'easeOutCubic'})
            .belowTokens()
            .opacity(0.8)
            .tint('#d53333')
            .filter('ColorMatrix', {saturate:-0.25  ,contrast:-0.2, brightness: 2})
            .repeats(3, 1200,1200)
            .playIf(tintMap)
        .effect()
            .file(token.document.texture.src)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.25)
            .filter('ColorMatrix', {brightness: 0.75})
        .canvasPan()
        .shake({duration: 100, strength: 4, rotation: false})
        .effect()
            .file(token.document.texture.src)
            .delay(1200)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.5)
            .filter('ColorMatrix', {brightness: 0.5})
        .canvasPan()
        .delay(1200)
        .shake({duration: 100, strength: 4, rotation: false})
        .effect()
            .file(token.document.texture.src)
            .delay(2400)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.75)
            .filter('ColorMatrix', {brightness: 0.25})
        .canvasPan()
        .delay(2400)
        .shake({duration: 100, strength: 4, rotation: false})
        .effect()
            .delay(4200)
            .file('jb2a.eyes.01.dark_red.single')
            .duration(1250)
            .atLocation(token)
            .size(1.15, {gridUnits: true})
            .fadeOut(500)
            .zIndex(1)
        .effect()
            .file(token.document.texture.src)
            .delay(3600)
            .attachTo(token)
            .duration(2000)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.75)
            .filter('ColorMatrix', {brightness: 0.2})
        .canvasPan()
        .delay(3600)
        .shake({duration: 100, strength: 4, rotation: false})
        .effect()
            .delay(3600)
            .file(token.document.parent.background.src)
            .atLocation({x: token.document.parent.dimensions.width / 2, y: token.document.parent.dimensions.height / 2})
            .size({width: token.document.parent.width / token.document.parent.grid.size, height: token.document.parent.height / canvas.grid.size}, {gridUnits: true})
            .spriteOffset({x: 0},{gridUnits: true})
            .duration(6000)
            .fadeIn(250)
            .fadeOut(500, {ease: 'easeOutCubic'})
            .belowTokens()
            .opacity(0.8)
            .tint('#d53333')
            .filter('ColorMatrix', {saturate: -0.25  ,contrast: -0.2,  brightness: 2})
        .effect()
            .delay(3600)
            .file('jb2a.template_circle.vortex.loop.dark_black')
            .atLocation(token)
            .duration(2500)
            .fadeIn(500)
            .scaleIn(0, 750, {ease: 'easeOutSine'})
            .fadeOut(500)
            .size(1.55, {gridUnits: true})
            .randomRotation()
            .filter('ColorMatrix', {saturate: 0, brightness: 0})
            .belowTokens()
        .animation()
            .delay(3600)
            .on(token)
            .opacity(0)
        .effect()
            .name(name)
            .file('jb2a.token_border.circle.static.orange.012')
            .delay(3600)
            .attachTo(token)
            .fadeIn(1000)
            .fadeOut(500)
            .size(1.5, {gridUnits: true})
            .filter('ColorMatrix', {saturate: 1})
            .tint('#FF0000')
            .belowTokens()
            .persist()
            .opacity(1)
            .zIndex(0)
        .effect()
            .copySprite(token)
            .delay(3600)
            .atLocation(token)
            .duration(2500)
            .fadeIn(350)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(1)
            .filter('ColorMatrix', {brightness: 0})
            .filter('Blur', {blurX: 5, blurY: 5})
            .zIndex(0)
            .waitUntilFinished(-1000)
        .thenDo(callback)
        .canvasPan()
        .shake({duration: 4500, fadeOutDuration: 500, strength: 2, rotation: false})
        .wait(250)
        .animation()
            .on(token)
            .teleportTo(token.center, {relativeToCenter: true})
            .opacity(1)
        .wait(250)
            .effect()
            .file('jb2a.claws.200px.dark_red')
            .atLocation(token)
            .size(2.25, {gridUnits: true})
            .fadeOut(500)
            .playbackRate(1)
            .belowTokens()
            .zIndex(1)
        .effect()
            .file('jb2a.impact.004.dark_red')
            .atLocation(token)
            .size(2.75, {gridUnits: true})
            .belowTokens()
            .fadeOut(500)
            .filter('ColorMatrix', {brightness: 0})
            .opacity(0.85)
            .zIndex(0.9)
        .effect()
            .file('jb2a.impact.004.dark_red')
            .atLocation(token)
            .size(2.75, {gridUnits: true})
            .belowTokens()
            .fadeOut(500)
            .filter('ColorMatrix', {brightness: 0})
            .opacity(0.85)
            .zIndex(0.9)
        .effect()
            .delay(450)
            .file('jb2a.impact.004.dark_red')
            .atLocation(token)
            .size(2.75, {gridUnits: true})
            .belowTokens()
            .fadeOut(750)
            .randomRotation()
            .filter('ColorMatrix', {brightness: 0})
            .opacity(0.45)
            .repeats(7, 450,450)
            .zIndex(0.9)
        .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.01.fast')
            .attachTo(token, {bindAlpha: false})
            .size(10, {gridUnits: true})
            .opacity(0.75)
            .filter('ColorMatrix', {saturate: -1, brightness: 0})
            .loopProperty('sprite', 'position.x', {from: 0.01 , to: -0.01, gridUnits: true, pingPong: true, duration: 50})
            .belowTokens()
            .repeats(8, 450,450)
            .fadeOut(1000)
            .zIndex(0)
        .play();
    /* eslint-enable indent */
}
async function shapeChange(token, {callback} = {}) {
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .attachTo(token)
            .duration(5000)
            .fadeIn(500)
            .scaleIn(0, 750, {ease: 'easeOutSine'})
            .fadeOut(500)
            .scaleToObject(1.5)
            .randomRotation()
            .filter('ColorMatrix', {saturate: 0, brightness: 0})
            .animateProperty('sprite', 'scale.x', {from: 0, to: 0.25 * token.document.texture.scaleX, duration: 500, gridUnits: true, ease:'easeOutCubic', delay: 2600})
            .animateProperty('sprite', 'scale.y', {from: 0, to: 0.25 * token.document.texture.scaleX, duration: 500, gridUnits: true, ease:'easeOutCubic', delay: 2600})
            .belowTokens()
        .effect()
            .delay(400)
            .file('jb2a.template_circle.vortex.loop.dark_black')
            .attachTo(token)
            .duration(4000)
            .fadeIn(500)
            .scaleIn(0, 2400, {ease: 'easeOutSine'})
            .fadeOut(500)
            .scaleToObject(1.55, {considerTokenScale: true})
            .randomRotation()
            .filter('ColorMatrix', {saturate: 0, brightness:0})
            .belowTokens()
        .effect()
            .copySprite(token)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.65)
            .repeats(3, 800,800)
        .effect()
            .file(token.document.texture.src)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.25)
            .filter('ColorMatrix', { brightness:0.75 })
        .effect()
            .file(token.document.texture.src)
            .delay(800)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.5)
            .filter('ColorMatrix', {brightness:0.5})
        .effect()
            .file(token.document.texture.src)
            .delay(1600)
            .attachTo(token)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.75)
            .filter('ColorMatrix', {brightness:0.25})
        .effect()
            .delay(3000)
            .file('jb2a.eyes.01.dark_red.single')
            .duration(1250)
            .attachTo(token)
            .scaleToObject(1.15)
            .fadeOut(500)
            .zIndex(1)
        .effect()
            .file(token.document.texture.src)
            .delay(2400)
            .attachTo(token)
            .duration(2000)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(0.75)
            .filter('ColorMatrix', {brightness:0.2})
        .effect()
            .copySprite(token)
            .delay(2400)
            .attachTo(token)
            .duration(2000)
            .fadeIn(750)
            .fadeOut(500)
            .scaleToObject(token.document.texture.scaleX)
            .animateProperty('sprite', 'width', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 500, gridUnits: false, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 1, to: 0.06 * token.document.parent.grid.size, duration: 750, gridUnits: false, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.x', {from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true})
            .opacity(1)
            .filter('ColorMatrix', {brightness: 0})
            .filter('Blur', {blurX: 5, blurY: 5})
            .zIndex(0)
            .waitUntilFinished(-500)
        .thenDo(callback)    
        .effect()
            .file('jb2a.claws.200px.dark_red')
            .atLocation(token)
            .scaleToObject(2.15)
            .fadeOut(500)
            .playbackRate(1.5)
            .belowTokens()
            .zIndex(1)
        .effect()
            .file('jb2a.impact.004.dark_red')
            .atLocation(token)
            .scaleToObject(2.75)
            .belowTokens()
            .fadeOut(500)
            .filter('ColorMatrix', {brightness:0})
            .opacity(0.85)
        .play();
    /* eslint-enable indent */
}
async function shapechange({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let bite = activityUtils.getActivityByIdentifier(workflow.item, 'bite', {strict: true});
    let human = activityUtils.getActivityByIdentifier(workflow.item, 'human', {strict: true});
    if (!bite || !human) return;
    let vae = [
        {
            type: 'use',
            name: bite.name,
            identifier: 'harkonsBite',
            activityIdentifier: 'bite'
        },
        {
            type: 'use',
            name: human.name,
            identifier: 'harkonsBite',
            activityIdentifier: 'human'
        }
    ];
    let identifier = activityUtils.getIdentifier(workflow.activity);
    let activityIdentifiers = ['bite', 'human'];
    if (identifier === 'hybrid') {
        let claws = activityUtils.getActivityByIdentifier(workflow.item, 'claws', {strict: true});
        if (claws) vae.push({
            type: 'use',
            name: claws.name,
            identifier: 'harkonsBite',
            activityIdentifier: 'claws'
        });
        activityIdentifiers.push('claws');
    } else {
        effectData.changes.push({
            key: 'system.attributes.movement.walk',
            mode: 4,
            value: 40,
            priority: 20
        });
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'harkonsBiteEffect');
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let animation = itemUtils.getConfig(workflow.item, identifier + 'Animation');
    let createEffectFunction = async function () {
        if (effect) await genericUtils.remove(effect);
        await effectUtils.createEffect(workflow.actor, effectData, {
            identifier: 'harkonsBiteEffect',
            vae,
            unhideActivities: [
                {
                    itemUuid: workflow.item.uuid,
                    activityIdentifiers,
                    favorite: true
                }
            ],
            rules: 'legacy',
            avatarImg: itemUtils.getConfig(workflow.item, identifier + 'AvatarImg'),
            avatarImgPriority: itemUtils.getConfig(workflow.item, identifier + 'AvatarImgPriority'),
            tokenImg: itemUtils.getConfig(workflow.item, identifier + 'TokenImg'),
            tokenImgPriority: itemUtils.getConfig(workflow.item, identifier + 'TokenImgPriority'),
            animate: !playAnimation
        });
    };
    if (playAnimation) {
        if (animation === 'moonFrenzy') {
            await moonFrenzy(workflow.token, {callback: createEffectFunction, tintMap: itemUtils.getConfig(workflow.item, 'tintMap'), color: itemUtils.getConfig(workflow.item, 'moonColor') ? 'red' : 'white'});
        } else {
            await shapeChange(workflow.token, {callback: createEffectFunction});
        }
    } else {
        await createEffectFunction();
    }
}
async function keenHearingAndSmell({trigger: {entity: item, skillId}, workflow}) {
    if (skillId != 'prc') return;
    if (!itemUtils.getEquipmentState(item)) return;
    return {
        label: genericUtils.translate('CHRISPREMADES.Macros.HarkonsBite.Keen'),
        type: 'advantage'
    };
}
async function human({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'harkonsBiteEffect');
    if (effect) await genericUtils.remove(effect);
}
async function removed({trigger: {entity: effect}}) {
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Moon Frenzy', object: token});
}
async function bite({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (actorUtils.typeOrRace(workflow.hitTargets.first().actor) != 'humanoid') return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'humanoid', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, Array.from(workflow.hitTargets), {consumeResources: true, consumeUsage: true});
}
export let harkonsBite = {
    name: 'Harkon\'s Bite',
    version: '1.3.110',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: shapechange,
                priority: 50,
                activities: ['hybrid', 'wolf']
            },
            {
                pass: 'rollFinished',
                macro: human,
                priority: 50,
                activities: ['human']
            },
            {
                pass: 'rollFinished',
                macro: bite,
                priority: 50,
                activities: ['bite']
            }
        ]
    },
    skill: [
        {
            pass: 'context',
            macro: keenHearingAndSmell,
            priority: 50
        }
    ],
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'wolfAnimation',
            label: 'CHRISPREMADES.Macros.HarkonsBite.WolfAnimation',
            type: 'select',
            default: 'shapechange',
            category: 'animation',
            options: [
                {
                    value: 'moonFrenzy',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.MoonFrenzy'
                },
                {
                    value: 'shapechange',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.Shapechange'
                }
            ]
        },
        {
            value: 'hybridAnimation',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAnimation',
            type: 'select',
            default: 'moonFrenzy',
            category: 'animation',
            options: [
                {
                    value: 'moonFrenzy',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.MoonFrenzy'
                },
                {
                    value: 'shapechange',
                    label: 'CHRISPREMADES.Macros.HarkonsBite.Shapechange'
                }
            ]
        },
        {
            value: 'tintMap',
            label: 'CHRISPREMADES.Config.TintMap',
            type: 'checkbox',
            default: false,
            category: 'animation'
        },
        {
            value: 'moonColor',
            label: 'CHRISPREMADES.Macros.HarkonsBite.MoonColor',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'hybridTokenImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridTokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'hybridTokenImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridTokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'hybridAvatarImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'hybridAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.HybridAvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'wolfTokenImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.WolfTokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'wolfTokenImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.WolfTokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'wolfAvatarImg',
            label: 'CHRISPREMADES.Macros.HarkonsBite.WolfAvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'wolfAvatarImgPriority',
            label: 'CHRISPREMADES.Macros.HarkonsBite.WolfAvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ],
    utilFunctions: {
        moonFrenzy,
        shapeChange
    }
};
export let harkonsBiteEffect = {
    name: 'Harkons Bite: Effect',
    version: harkonsBite.version,
    rules: harkonsBite.rules,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};