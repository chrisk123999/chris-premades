import {actorUtils, animationUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: genericUtils.handleMetric(60),
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                fly: {
                    playAnimation: itemUtils.getConfig(workflow.item, 'playAnimation')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['flyFlying']);
    for (let token of workflow.targets) {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item, interdependent: true});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function start({trigger: {entity: effect}}) {
    let playAnimation = effect.flags['chris-premades']?.fly?.playAnimation;
    if (!playAnimation || !animationUtils.aseCheck()) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    new Sequence()
        .effect()
        .file('animated-spell-effects-cartoon.air.puff.03')
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens()

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .from(token)
        .name('Fly')
        .atLocation(token)   
        .opacity(1)
        .duration(800)
        .anchor({'x': 0.5, 'y': 0.7})
        .animateProperty('sprite', 'position.y', {'from': 30, 'to': 0, 'duration': 500})
        .loopProperty('sprite', 'position.y', {'from':0 , 'to':-30, 'duration': 2500, 'pingPong': true, 'delay':500})
        .attachTo(token, {'bindAlpha': false})
        .zIndex(2)
        .persist()

        .effect()
        .from(token)
        .name('Fly')
        .atLocation(token)
        .scaleToObject(0.9)
        .duration(1000)
        .opacity(0.5)
        .belowTokens()
        .filter('ColorMatrix', {'brightness': -1 })
        .filter('Blur', {'blurX': 5, 'blurY': 10 })
        .attachTo(token, {'bindAlpha': false})
        .zIndex(1)
        .persist()

        .play();
}
async function end({trigger: {entity: effect}}) {
    let playAnimation = effect.flags['chris-premades']?.fly?.playAnimation;
    if (!playAnimation || !animationUtils.aseCheck()) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    await Sequencer.EffectManager.endEffects({name: 'Fly', object: token});
    new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}
export let fly = {
    name: 'Fly',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
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
export let flyFlying = {
    name: 'Fly: Flying',
    version: fly.version,
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