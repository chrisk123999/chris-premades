import {socket, sockets} from '../../../lib/sockets.js';
import {animationUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                blink: {
                    playAnimation
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'blink',
        rules: 'modern',
        macros: [{type: 'combat', macros: ['blinkBlinking']}]
    });
}
async function turnStart({trigger: {entity: effect, token}}) {
    let playAnimation = effect.flags['chris-premades'].blink.playAnimation && animationUtils.jb2aCheck();
    await socket.executeAsUser(sockets.teleport.name, socketUtils.firstOwner(token.actor, true), [token.document.uuid], token.document.uuid, {range: 10, animation: playAnimation ? 'mistyStep' : 'none'});
    await genericUtils.remove(effect);
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let blinkRoll = await new Roll('1d6').evaluate();
    blinkRoll.toMessage({
        rollMode: 'roll',
        speaker: {
            scene: token.scene.id,
            actor: token.actor.id,
            token: token.id,
            alias: token.name
        },
        flavor: effect.name
    });
    if (blinkRoll.total < 4) return;
    let playAnimation = effect.flags['chris-premades'].blink.playAnimation;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.Blink.Away'),
        img: effect.img,
        origin: effect.uuid,
        duration: {
            rounds: 2
        },
        changes: [
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 4,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 0,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'spectral-body',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                blink: {
                    playAnimation
                }
            }
        }
    };
    await effectUtils.createEffect(token.actor, effectData, {
        identifier: 'blinkBlinkedAway',
        rules: 'modern',
        macros: [{type: 'combat', macros: ['blinkBlinkedAway']}]
    });
}
export let blink = {
    name: 'Blink',
    version: '1.1.17',
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
export let blinkBlinking = {
    name: 'Blink: Blinking',
    version: blink.version,
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
export let blinkBlinkedAway = {
    name: 'Blink: Blinked Away',
    version: blink.version,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};