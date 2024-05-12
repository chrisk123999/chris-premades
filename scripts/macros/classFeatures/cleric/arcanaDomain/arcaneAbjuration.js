import {queue} from '../../../../utility/queue.js';
import {chris} from '../../../../helperFunctions.js';
import {banishment} from '../../../spells/banishment.js';
import {constants} from '../../../../constants.js';
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'arcaneAbjuration', 50);
    if (!queueSetup) return;
    let effectData = {
        'name': 'Invalid Target',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'value': 99,
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            },
            'chris-premades': {
                'effect': {
                    'noAnimation': true
                }
            }
        },
        'origin': workflow.item.uuid
    };
    let validTypes = [
        'celestial',
        'elemental',
        'fey',
        'fiend'
    ];
    for (let i of Array.from(workflow.targets)) if (!validTypes.includes(chris.raceOrType(i.actor))) await chris.createEffect(i.actor, effectData);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let levels = workflow.actor.classes.cleric?.system?.levels ?? 0;
    let target = workflow.targets.first();
    if (levels >= 5) {
        let cr = chris.levelOrCR(target.actor);
        let maxCR = 0.5;
        if (levels >= 8 && 10 > levels) {
            maxCR = 1;
        } else if (levels >= 11 && 14 > levels) {
            maxCR = 2;
        } else if (levels >= 14 && 17 > levels) {
            maxCR = 3;
        } else {
            maxCR = 4;
        }
        if (cr <= maxCR) {
            await chris.gmDialogMessage();
            let selection = await chris.remoteDialog(workflow.item.name, constants.yesNo, chris.lastGM(), 'Is ' + target.actor.name + ' away from its plane of origin?');
            await chris.clearGMDialogMessage();
            if (selection) {
                await banishment.item({workflow}, 'Banishment', {'buttons': true, 'inputs': [target.document.uuid]});
                return;
            }
        }
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'dae': {
                'specialDuration': [
                    'isDamaged'
                ]
            },
            'effectmacro': {
                'onTurnStart': {
                    'script': 'await chrisPremades.macros.arcaneAbjuration.turnStart(token, effect);'
                }
            }
        }
    };
    let effect = await chris.createEffect(target.actor, effectData);
    await chris.addCondition(target.actor, 'Reaction', false, workflow.item.uuid);
    await updateEffect(target, effect);
}
async function turnStart(token, effect) {
    await warpgate.wait(100);
    await chris.addCondition(token.actor, 'Reaction', false, effect.origin);
    await updateEffect(token, effect);
}
async function updateEffect(token, originEffect) {
    let effect = chris.findEffect(token.actor, 'Reaction');
    if (!effect) return;
    let updates = {
        'flags': {
            'dae': {
                'specialDuration': [
                    'isDamaged'
                ]
            }
        }
    };
    await chris.updateEffect(effect, updates);
    originEffect.addDependent(effect);
}
export let arcaneAbjuration = {
    'early': early,
    'item': item,
    'turnStart': turnStart
};