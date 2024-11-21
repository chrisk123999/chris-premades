import {actorUtils, animationUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                detectMagic: {
                    playAnimation: itemUtils.getConfig(workflow.item, 'playAnimation')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['detectMagicDetecting']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'detectMagic'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function start({trigger: {entity}}) {
    let playAnimation = entity.flags['chris-premades']?.detectMagic?.playAnimation;
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    let anim = 'jb2a.detect_magic.circle.blue';
    new Sequence()
        .effect()
        .file(anim)
        .atLocation(token)
        .attachTo(token)
        .zIndex(1)
        .fadeIn(250)
        .fadeOut(500)
        .persist()
        .name('Detect Magic')
        .play();
}
async function end({trigger: {entity}}) {
    let playAnimation = entity.flags['chris-premades']?.detectMagic?.playAnimation;
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Detect Magic', object: token});
}
export let detectMagic = {
    name: 'Detect Magic',
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
export let detectMagicDetecting = {
    name: 'Detect Magic: Detecting',
    version: detectMagic.version,
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