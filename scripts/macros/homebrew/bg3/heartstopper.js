import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {constants} from '../../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'heartstopper', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) {
        workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
        workflow.item.prepareData();
        workflow.item.prepareFinalAttributes();
    }
    queue.remove(workflow.item.uuid);
    if (workflow.targets.size != 1) return;
    let race = chris.raceOrType(workflow.targets.first().actor);
    if (!(race === 'undead' || race === 'construct')) return;
    let effectData = {
        'label': 'Invalid Creature',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.str',
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
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.heartstopper ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.heartstopper': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = [
        'morningstar'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Heartstopper');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'heartstopper', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use Heartstopper?');
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
export let heartstopper = {
    'item': item,
    'turn': turn,
    'attack': attack
}