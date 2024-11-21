import {socket, sockets} from '../../lib/sockets.js';
import {animationUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../utils.js';

async function use({workflow}) {
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
    effectUtils.addMacro(effectData, 'combat', ['blinkBlinking']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'blink'});
}
async function turnStart({trigger: {entity: effect, token}}) {
    let playAnimation = effect.flags['chris-premades'].blink.playAnimation && animationUtils.jb2aCheck();
    await socket.executeAsUser(sockets.teleport.name, socketUtils.firstOwner(token.actor, true), [token.document.uuid], token.document.uuid, {range: 10, animation: playAnimation ? 'mistyStep' : 'none'});
    await genericUtils.remove(effect);
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let blinkRoll = await new Roll('1d20').evaluate();
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
    if (blinkRoll.total < 11) return;
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
                value: 1,
                mode: 5,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                value: 100,
                mode: 5,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 100,
                mode: 5,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                value: 1,
                mode: 5,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                value: 'spectral-body',
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                value: true,
                mode: 0,
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
    effectUtils.addMacro(effectData, 'combat', ['blinkBlinkedAway']);
    await effectUtils.createEffect(token.actor, effectData, {identifier: 'blinkBlinkedAway'});
}
export let blink = {
    name: 'Blink',
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