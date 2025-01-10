import {activityUtils, actorUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dreadLordShadowAttack', {strict: true});
    if (!feature) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                dreadLord: {
                    playAnimation,
                    originalAvatarImg: workflow.actor.img,
                    originalPrototypeImg: workflow.actor.prototypeToken.texture.src,
                    originalTokenImg: workflow.token.document.texture.src
                }
            }
        }
    };
    let updates = {
        actor: {},
        token: {}
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) {
        genericUtils.setProperty(updates.actor, 'img', avatarImg);
    }
    if (tokenImg) {
        genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates.token, 'texture.src', tokenImg);
    }
    effectUtils.addMacro(effectData, 'aura', ['dreadLordAura']);
    effectUtils.addMacro(effectData, 'effect', ['dreadLordAura']);
    effectUtils.addMacro(effectData, 'combat', ['dreadLordAura']);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'dreadLord', 
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'dreadLord',
            activityIdentifier: 'dreadLordShadowAttack',
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dreadLordShadowAttack'],
            favorite: true
        }
    });
    playAnimation = playAnimation && animationUtils.jb2aCheck() === 'patreon';
    if (!playAnimation) {
        if (Object.entries(updates.actor)?.length) {
            await genericUtils.update(workflow.actor, updates.actor);
        }
        if (Object.entries(updates.token)?.length) {
            await genericUtils.update(workflow.token.document, updates.token);
        }
        return;
    }
    //Animation by Eskiemoh
    let mainSequence = new Sequence()
        .effect()
        .file('jb2a.energy_strands.in.red.01')
        .attachTo(workflow.token)
        .scaleToObject(9, {'considerTokenScale': true})
        .filter('ColorMatrix', {'brightness': 0})
        .randomRotation()
        .belowTokens()
        .zIndex(0.1)

        .effect()
        .file('jb2a.token_border.circle.static.purple.004')
        .name('Dread Lord')
        .attachTo(workflow.token)
        .opacity(0.6)
        .scaleToObject(1.7, {'considerTokenScale': true})
        .fadeIn(500)
        .fadeOut(500)
        .duration(2500)
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -5})
        .tint('#e51e19')
        .belowTokens()
        .zIndex(2);
        
    if (canvas.scene.background.src) {
        mainSequence = mainSequence
            .effect()
            .file(canvas.scene.background.src)
            .filter('ColorMatrix', {'brightness': 0.3})
            .atLocation({'x': canvas.dimensions.width / 2, 'y': canvas.dimensions.height / 2})
            .size({'width': canvas.scene.width / canvas.grid.size, 'height': canvas.scene.height / canvas.grid.size}, {'gridUnits': true})
            .spriteOffset({'x': 0}, {'gridUnits': true})
            .duration(7000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens();
    }
    mainSequence
        .effect()
        .file('jb2a.particles.outward.red.01.03')
        .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'bindRotation': false})
        .size(0.5 * workflow.token.document.width, {'gridUnits': true})
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'width', {'from': 0, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack'})
        .animateProperty('sprite', 'height', {'from': 0, 'to': 1.0, 'duration': 1000, 'gridUnits': true, 'ease': 'easeOutBack'})
        .animateProperty('sprite', 'position.y', {'from': 0, 'to': -0.6, 'duration': 1000, 'gridUnits': true})
        .filter('ColorMatrix', {'saturate': 1, 'hue': 20})
        .zIndex(0.3)

        .effect()
        .file('jb2a.flames.04.complete.purple')
        .attachTo(workflow.token, {'offset': {'y': -0.35}, 'gridUnits': true, 'bindRotation': true})
        .scaleToObject(1.5 * workflow.token.document.texture.scaleX)
        .tint('#e51e19')
        .fadeOut(500)
        .scaleOut(0, 500, {'ease': 'easeOutCubic'})
        .duration(2500)
        .zIndex(1)
        .waitUntilFinished(-500)

        .effect()
        .file('jb2a.impact.ground_crack.dark_red.01')
        .atLocation(workflow.token)
        .belowTokens()
        .filter('ColorMatrix', {'hue': -15, 'saturate': 1})
        .size(7, {'gridUnits': true})
        .tint('#e51e19')
        .zIndex(0.1)
        .thenDo(async function(){
            if (Object.entries(updates.actor)?.length) {
                await genericUtils.update(workflow.actor, updates.actor);
            }
            if (Object.entries(updates.token)?.length) {
                await genericUtils.update(workflow.token.document, updates.token);
            }
        })
        .canvasPan()
        .shake({'duration': 3000, 'strength': 2, 'rotation': false, 'fadeOut': 3000})

        .effect()
        .file('jb2a.token_border.circle.static.purple.004')
        .name('Dread Lord')
        .attachTo(workflow.token)
        .opacity(0.6)
        .scaleToObject(1.7, {'considerTokenScale': true})
        .fadeIn(250)
        .fadeOut(500)
        .duration(2500)
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -5})
        .tint('#e51e19')
        .persist()
        .zIndex(2)

        .effect()
        .name('Dread Lord')
        .file('jb2a.energy_strands.complete.dark_red.01')
        .attachTo(workflow.token)
        .scaleToObject(2, {'considerTokenScale': true})
        .opacity(1)
        .filter('ColorMatrix', {'brightness': 0})
        .scaleIn(0, 1000, {'ease': 'easeOutBack'})
        .belowTokens()
        .persist()
        .zIndex(3)

        .effect()
        .name('Dread Lord')
        .file('jb2a.energy_strands.overlay.dark_red.01')
        .attachTo(workflow.token)
        .scaleToObject(2, {'considerTokenScale': true})
        .filter('ColorMatrix', {'brightness': 0})
        .scaleIn(0, 1000, {'ease': 'easeOutBack'})
        .belowTokens()
        .persist()
        .zIndex(3)

        .effect()
        .name('Dread Lord')
        .file('jb2a.template_circle.aura.01.complete.small.bluepurple')
        .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'bindRotation': true})
        .size(7.5, {'gridUnits': true})
        .opacity(0.7)
        .scaleIn(0, 250, {'ease': 'easeOutBack'})
        .scaleOut(0, 6500, {'ease': 'easeInSine'})
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
        .tint('#e51e19')
        .randomRotation()
        .belowTokens()
        .persist()
        .zIndex(0.3)

        .effect()
        .name('Dread Lord')
        .file('jb2a.extras.tmfx.outflow.circle.02')
        .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'bindRotation': true})
        .size(13, {'gridUnits': true})
        .opacity(0.65)
        .scaleIn(0, 250, {'ease': 'easeOutBack'})
        .scaleOut(0, 6500, {'ease': 'easeInSine'})
        .filter('ColorMatrix', {'brightness': 0})
        .belowTokens()
        .persist()
        .zIndex(0.2)

        .effect()
        .name('Dread Lord')
        .file('jb2a.extras.tmfx.outflow.circle.01')
        .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'bindRotation': true})
        .size(13, {'gridUnits': true})
        .opacity(0.7)
        .scaleIn(0, 250, {'ease': 'easeOutBack'})
        .scaleOut(0, 6500, {'ease': 'easeInSine'})
        .filter('ColorMatrix', {'brightness': 0})
        .rotate(90)
        .loopProperty('sprite', 'rotation', {'from': 0, 'to': 360, 'duration': 20000})
        .belowTokens()
        .persist()
        .zIndex(0.3)

        .effect()
        .file('jb2a.impact.003.dark_red')
        .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'bindRotation': true})
        .scaleToObject(1, {'considerTokenScale': true})
        .zIndex(2)

        .play();

}
async function late({workflow}) {
    if (!workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dreadLord');
    if (!effect) return;
    let playAnimation = effect.flags['chris-premades'].dreadLord.playAnimation && animationUtils.jb2aCheck() === 'patreon';
    if (!playAnimation) return;
    let target = workflow.targets.first();
    //Animation by Eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.melee_generic.piercing.two_handed')
        .atLocation(target)
        .spriteOffset({'x': -5.6, 'y': 0.1}, {'gridUnits': true})
        .size(8, {'gridUnits': true})
        .rotateTowards(workflow.token)
        .playbackRate(0.8)
        .randomizeMirrorY()
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .rotate(180)
        .zIndex(1)
        
        .effect()
        .from(target)
        .attachTo(target)
        .fadeIn(500)
        .fadeOut(500)
        .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 55, 'pingPong': true, 'gridUnits': true})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0.5})
        .scaleToObject(1, {'considerTokenScale': true})
        .opacity(0.65)
        .zIndex(0.1)
        
        .play();
}
async function end({trigger: {entity: effect}}) {
    let {originalAvatarImg, originalPrototypeImg, originalTokenImg} = effect.flags['chris-premades'].dreadLord;
    let actor = effect.parent;
    let token = actorUtils.getFirstToken(actor)?.document;
    if (!actor) return;
    let currAvatarImg = actor.img;
    let currPrototypeImg = actor.prototypeToken.texture.src;
    let currTokenImg = token?.texture.src;
    let updates = {
        actor: {},
        token: {}
    };
    if (currAvatarImg !== originalAvatarImg) genericUtils.setProperty(updates.actor, 'img', originalAvatarImg);
    if (currPrototypeImg !== originalPrototypeImg) genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', originalPrototypeImg);
    if (currTokenImg !== originalTokenImg) genericUtils.setProperty(updates.token, 'texture.src', originalTokenImg);
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(actor, updates.actor);
    }
    if (token && Object.entries(updates.token)?.length) {
        await genericUtils.update(token, updates.token);
    }
    if (token) Sequencer.EffectManager.endEffects({name: 'Dread Lord', object: token.object});
}
async function create({trigger: {entity: effect, target, identifier}}) {
    if (effectUtils.getEffectByIdentifier(target.actor, identifier)) return;
    let detectionModes = CONFIG.Canvas.detectionModes;
    // eslint-disable-next-line no-undef
    let nonSightDetectionModes = Object.keys(detectionModes).filter(i => detectionModes[i].type !== DetectionMode.DETECTION_TYPES.SIGHT);
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.DreadLord.ShadowAura'),
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'flags.midi-qol.grants.disadvantage.attack.all',
                value: '!canSense(tokenUuid, workflow.targets.first(), ' + JSON.stringify(nonSightDetectionModes) + ')',
                mode: 5,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    // await effectUtils.createEffect(target.actor, effectData, {identifier});
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
async function turnStart({trigger: {entity: effect, token, target}}) {
    let frightened = effectUtils.getEffectByStatusID(target.actor, 'frightened');
    if (!frightened) return;
    let validKeys = ['macro.CE', 'macro.CUB', 'macro.StatusEffect', 'StatusEffect'];
    let frightenedOfActor = actorUtils.getEffects(target.actor).find(i => 
        (
            i.statuses.has('frightened') || // Status Effect dropdown on details page
            i.flags['chris-premades']?.conditions?.includes('frightened') || // CPR effect medkit
            i.changes.find(j => validKeys.includes(j.key) && j.value.toLowerCase() === 'frightened') // dae/midi key
        )
        && fromUuidSync(i.origin)?.actor === token.actor
    );
    if (!frightenedOfActor) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'dreadLordTurnStart', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [target]);
}
export let dreadLord = {
    name: 'Dread Lord',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['dreadLord']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['dreadLordShadowAttack']
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
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DreadLord',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DreadLord',
            type: 'file',
            default: '',
            category: 'visuals'
        }
    ],
    ddbi: {
        removedItems: {
            'Dread Lord': [
                'Dread Lord Shadow Attack'
            ]
        }
    }
};
export let dreadLordAura = {
    name: 'Dread Lord: Aura',
    version: dreadLord.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'dreadLordAura',
            disposition: 'ally'
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 30,
            disposition: 'enemy'
        }
    ]
};