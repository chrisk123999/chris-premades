import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'twilightSanctuary');
    if (effect) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 30,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'combat', ['twilightSanctuaryActive']);
    if (itemUtils.getItemByIdentifier(workflow.actor, 'twilightShroud')) effectUtils.addMacro(effectData, 'midi.actor', ['twilightShroudActive']);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    if (playAnimation) effectUtils.addMacro(effectData, 'effect', ['twilightSanctuaryActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'twilightSanctuary'});
    if (!playAnimation) return;
    let image = 'modules/chris-premades/images/twilightSanctuary.webp';
    /* eslint-disable indent */
    new Sequence()
        .wait(250)
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.markers.light_orb.complete.white')
            .attachTo(workflow.token)
            .scaleToObject(0.65)
            .persist()
        .effect()
            .file('jb2a.energy_strands.in.blue')
            .attachTo(workflow.token)
            .scaleToObject(2.5)
            .filter('ColorMatrix', {brightness: 0})
            .belowTokens()
            .opacity(0.8)
            .playbackRate(1.2)
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.moonbeam.01.complete.yellow')
            .attachTo(workflow.token)
            .size(12.5, {gridUnits:true})
            .belowTokens()
            .fadeOut(7000, {ease: 'easeOutCubic'})
            .filter('ColorMatrix', {brightness:0, hue: 75 })
            .opacity(0.4)
            .persist()
            .zIndex(0)
            .wait(1000)
        .effect()
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .attachTo(workflow.token, {offset: {x: 0}, gridUnits: true})
            .scaleToObject(0.7, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -1})
            .zIndex(1)
        .effect()
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .attachTo(workflow.token, {offset: {x: 0}, gridUnits: true})
            .scaleToObject(13.5, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -1})
            .zIndex(1)
        .effect()
            .file('jb2a.healing_generic.03.burst.bluepurple')
            .attachTo(workflow.token)
            .scaleToObject(4, {considerTokenScale: true})
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter('ColorMatrix', {saturate: -0.5, hue: -50})
            .zIndex(2)
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.template_circle.aura.01.complete.small.bluepurple')
            .attachTo(workflow.token)
            .scaleToObject(2.5)
            .filter('ColorMatrix', {brightness: 0, saturate: -1})
            .opacity(0.75)
            .playbackRate(0.8)
            .persist()
            .belowTokens()
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.particles.outward.white.02.03')
            .attachTo(workflow.token)
            .size(9, {gridUnits: true})
            .persist()
            .belowTokens()
            .zIndex(2)
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.shield.02.complete.01.white')
            .attachTo(workflow.token)
            .size(18, {gridUnits: true})
            .filter('ColorMatrix', {brightness: 0, hue: 75})
            .persist()
            .opacity(0.2)
            .zIndex(1)
        .effect()
            .name('Twilight Sanctuary')
            .file('jb2a.shield.02.complete.01.white')
            .attachTo(workflow.token)
            .size(18, {gridUnits: true})
            .filter('ColorMatrix', {brightness: 0, hue: 75})
            .fadeIn(500)
            .fadeOut(500)
            .duration(1000)
            .opacity(1)
            .zIndex(1)
        .effect()
            .name('Twilight Sanctuary')
            .file(image)
            .attachTo(workflow.token)
            .size(12, {gridUnits: true})
            .scaleIn(0.25, 500, {ease: 'easeOutCubic'})
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .duration(13000)
            .filter('ColorMatrix', { saturate: -0.35, hue: 150})
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 120000})
            .loopProperty('alphaFilter', 'alpha', {from: 0, to: -0.5, duration: 5000, pingPong: true})
            .randomRotation()
            .opacity(1)
            .zIndex(2)
            .persist()
            .filter('Glow', {color: 0xd2f1fe, knockout: true})
        .effect()
            .name('Twilight Sanctuary')
            .file(image)
            .attachTo(workflow.token)
            .size(12, {gridUnits: true})
            .scaleIn(0.25, 500, {ease: 'easeOutCubic'})
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .duration(1000)
            .filter('ColorMatrix', {saturate:-0.35, hue: 150})
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 120000})
            .randomRotation()
            .opacity(1)
            .zIndex(2)
        .effect()
            .name('Twilight Sanctuary')
            .file(image)
            .attachTo(workflow.token)
            .size(9, {gridUnits: true})
            .scaleIn(0.25, 500, {ease: 'easeOutCubic'})
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .duration(1500)
            .filter('ColorMatrix', {saturate:-0.35, hue: 150})
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 30000})
            .loopProperty('alphaFilter', 'alpha', {from: 0, to: -0.25, duration: 5000, pingPong: true})
            .opacity(1)
            .zIndex(2)
            .persist()
            .filter('Glow', {color: 0xd2f1fe, knockout: true})
        .effect()
            .name('Twilight Sanctuary')
            .file(image)
            .attachTo(workflow.token)
            .size(9, {gridUnits: true})
            .scaleIn(0.25, 500, {ease: 'easeOutCubic'})
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .duration(1000)
            .filter('ColorMatrix', {saturate:-0.35, hue: 150})
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 30000})
            .opacity(1)
            .zIndex(2)
        .play();
        /* eslint-enable indent */
}
async function turnEnd({trigger: {entity: effect, token, target}}) {
    if (!target) target = token;
    let charmed = effectUtils.getEffectByStatusID(target.actor, 'charmed');
    let frightened = effectUtils.getEffectByStatusID(target.actor, 'frightened');
    let classLevel = token.actor.classes.cleric?.system?.levels ?? 0;
    let formula = '1d6 + ' + classLevel;
    let buttons = [
        [genericUtils.format('CHRISPREMADES.Macros.TwilightSanctuary.Heal', {formula}), 'hp']
    ];
    if (charmed) buttons.push(['CHRISPREMADES.Macros.TwilightSanctuary.Charmed', 'charmed']);
    if (frightened) buttons.push(['CHRISPREMADES.Macros.TwilightSanctuary.Frightened', 'frightened']);
    buttons.push(['DND5E.None', false]);
    let userId = socketUtils.firstOwner(token, true);
    if (!userId) return;
    let selection = await dialogUtils.buttonDialog(effect.name, 'CHRISPREMADES.Dialog.WhatDo', buttons, {userId});
    if (!selection) return;
    if (selection === 'hp') {
        let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'twilightSanctuaryHeal', {strict: true});
        if (!feature) return;
        await workflowUtils.syntheticActivityRoll(feature, [target]);
    } else if (selection === 'charmed') {
        await genericUtils.remove(charmed);
    } else if (selection === 'frightened') {
        await genericUtils.remove(frightened);
    }
}
async function end({trigger}) {
    let token = actorUtils.getFirstToken(trigger.entity.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Twilight Sanctuary', object: token});
}
export let twilightSanctuary = {
    name: 'Channel Divinity: Twilight Sanctuary',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['twilightSanctuary']
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
export let twilightSanctuaryActive = {
    name: 'Channel Divinity: Twilight Sanctuary Active',
    version: twilightSanctuary.version,
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50,
            distance: 30,
            disposition: 'ally'
        },
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};