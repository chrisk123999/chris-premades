import {activityUtils, actorUtils, animationUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                castLevel: workflowUtils.getCastLevel(workflow)
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['armorOfAgathysArmor']);
    effectUtils.addMacro(effectData, 'effect', ['armorOfAgathysArmor']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'armorOfAgathys'});
}
async function hit({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.uuid === effect.origin) return;
    let targetToken = workflow.hitTargets.first();
    let tempHP = targetToken.actor.system.attributes.hp.temp;
    if (tempHP === 0) await genericUtils.remove(effect);
    if (!constants.meleeAttacks.includes(workflow.item?.system?.actionType)) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(originItem, 'armorOfAgathysReflect', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token], {atLevel: effect.flags['chris-premades'].castLevel});
    let playAnimation = itemUtils.getConfig(originItem, 'playAnimation');
    if (!playAnimation) return;
    //Animations by: eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.impact.004.blue')
        .atLocation(targetToken)
        .rotateTowards(workflow.token)
        .scaleToObject(1.45)
        .spriteScale({'x': 0.75, 'y': 1.0 })
        .filter('ColorMatrix', {'saturate': -0.75, 'brightness': 1.5})
        .spriteOffset({'x': -0.15}, {'gridUnits': true})

        .effect()
        .atLocation(targetToken)
        .file('jb2a.side_impact.part.fast.ice_shard.blue')
        .rotateTowards(workflow.token)
        .scaleToObject(2)
        .randomizeMirrorY()
        .zIndex(2)

        .effect()
        .from(workflow.token)
        .atLocation(workflow.token)
        .fadeIn(100)
        .fadeOut(100)
        .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 175, 'pingPong': true, 'gridUnits': true})
        .scaleToObject(workflow.token.document.texture.scaleX)
        .duration(500)
        .opacity(0.15)

        .play();
}
async function start({trigger: {entity}}) {
    let playAnimation = itemUtils.getConfig(await effectUtils.getOriginItem(entity), 'playAnimation');
    if (!playAnimation) return;
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    if (animationUtils.jb2aCheck() !== 'patreon') return;
    new Sequence()
        .effect()
        .file('jb2a.ward.rune.dark_purple.01')
        .atLocation(token)
        .scaleToObject(1.85)
        .belowTokens()
        .fadeOut(3000)
        .scaleIn(0, 500, {ease: 'easeOutCubic'})
        .filter('ColorMatrix', {brightness: 2, saturate: -0.75, hue: -75})

        .effect()
        .attachTo(token)
        .delay(250)
        .file('jb2a.magic_signs.rune.02.complete.06.blue')
        .scaleToObject(0.75 * token.document.texture.scaleX)
        .scaleIn(0, 500, {ease: 'easeOutCubic'})
        .playbackRate(2.5)
        .opacity(1)
        .zIndex(3)

        .effect()
        .attachTo(token)
        .file('jb2a.extras.tmfx.border.circle.inpulse.01.fast')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .zIndex(3)

        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.extras.tmfx.inflow.circle.01')
        .scaleToObject(1 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .opacity(0.9)
        .zIndex(2)
        .extraEndDuration(1500)
        .private()
        .persist()
        
        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.extras.tmfx.outflow.circle.01')
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .opacity(0.9)
        .extraEndDuration(1500)
        .zIndex(1)
        .private()
        .persist()
        
        .effect()   
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.template_circle.symbol.normal.snowflake.blue')
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .belowTokens()
        .opacity(0.75)
        .extraEndDuration(1500)
        .zIndex(2)
        .private()
        .persist()
        
        .effect()
        .attachTo(token)
        .name('Armor of Agathys')
        .file('jb2a.shield.01.loop.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist()
        
        .waitUntilFinished(-1000)
        .play();
}
async function end({trigger: {entity}}) {
    let playAnimation = itemUtils.getConfig(await effectUtils.getOriginItem(entity), 'playAnimation');
    if (!playAnimation) return;
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    if (animationUtils.jb2aCheck() !== 'patreon') return;
    Sequencer.EffectManager.endEffects({name: 'Armor of Agathys', object: token});
    new Sequence()
        .effect()
        .attachTo(token)
        .file('jb2a.shield.01.outro_explode.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeOut(500)
        .zIndex(1)

        .play();
}
export let armorOfAgathys = {
    name: 'Armor of Agathys',
    version: '1.2.28',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['armorOfAgathys']
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
export let armorOfAgathysArmor = {
    name: 'Armor of Agathys: Armor',
    version: armorOfAgathys.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 250
            }
        ]
    },
    effect: [
        {
            pass: 'created',
            macro: start,
            priority: 50
        }, 
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};