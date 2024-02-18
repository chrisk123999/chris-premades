import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'maimingStrike', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) {
        workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
        workflow.item.prepareData();
        workflow.item.prepareFinalAttributes();
    }
    queue.remove(workflow.item.uuid);
    if (workflow.targets.size != 1) return;
    if (!workflow.targets.first().actor.system.attributes.movement.fly) return;
    let effectData = {
        'label': 'Flying Creature',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.con',
                'mode': 2,
                'value': '99',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave.con'
                ]
            }
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function save({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let effectData = {
        'label': 'Maimed',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.save.dex',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'system.attributes.movement.all',
                'mode': 0,
                'value': '*0',
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 18
        },
        'origin': null,
        'flags': {
            'chris-premades': {
                'feature': {
                    'maimingStrike': 0
                }
            },
            'effectmacro': {
                'onTurnEnd': {
                    'script': 'await chrisPremades.macros.bg3.maimingStrike.turn(effect);'
                }
            },
        }
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = [
        'warpick',
        'battleaxe',
        'trident'
    ];
    let baseItem = workflow.item.system.type?.baseItem;
    if (!validTypes.includes(baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Maiming Strike');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'maimingStrike', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use Maiming Strike?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature2, config, options);
    queue.remove(workflow.item.uuid);
}
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.maimingStrike ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.maimingStrike': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
export let maimingStrike = {
    'item': item,
    'save': save,
    'attack': attack,
    'turn': turn
}