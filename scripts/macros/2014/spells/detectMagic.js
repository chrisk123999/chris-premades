import {actorUtils, animationUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                detectMagic: {
                    playAnimation: itemUtils.getConfig(workflow.item, 'playAnimation'),
                    color: itemUtils.getConfig(workflow.item, 'color'),
                    opacity: itemUtils.getConfig(workflow.item, 'opacity'),
                    sound: itemUtils.getConfig(workflow.item, 'sound')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['detectMagicDetecting']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'detectMagic'});
}
async function start({trigger: {entity}}) {
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    let playAnimation = entity.flags['chris-premades']?.detectMagic?.playAnimation;
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let color = entity.flags['chris-premades']?.detectMagic?.color;
    let sound = entity.flags['chris-premades']?.detectMagic?.sound;
    let animation = 'jb2a.detect_magic.circle.' + color;
    let opacity = entity.flags['chris-premades']?.detectMagic?.opacity;
    new Sequence()
        .effect()
        .opacity(opacity)
        .file(animation)
        .atLocation(token)
        .attachTo(token)
        .zIndex(1)
        .fadeIn(250)
        .fadeOut(500)
        .persist()
        .name('Detect Magic')
        .sound()
        .playIf(sound)
        .file(sound)
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
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green_orange',
                    label: 'CHRISPREMADES.Config.Colors.GreenOrange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'grey',
                    label: 'CHRISPREMADES.Config.Colors.Grey',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'opacity',
            label: 'CHRISPREMADES.Config.Opacity',
            type: 'number',
            default: 1,
            category: 'animation',
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'sound'
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