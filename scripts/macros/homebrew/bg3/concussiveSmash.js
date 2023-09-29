import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {constants} from '../../../constants.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.actor.system.abilities.dex.save < workflow.actor.system.abilities.str.save) return;
    workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
}
async function save({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let effectData = {
        'label': 'Dazed',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.save.wis',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 18
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onTurnEnd': {
                    'script': 'await chrisPremades.macros.bg3.concussiveSmash.turn(effect);'
                }
            },
            'chris-premades': {
                'feature': {
                    'concussiveSmash': 0
                }
            }
        }
    };
    let armorTypes = [
        'light',
        'medium',
        'heavy'
    ];
    let armor = workflow.targets.first().actor.items.find(i => armorTypes.includes(i.system.armor?.type) && i.system.equipped);
    let dex = armor?.system?.armor?.dex ?? workflow.targets.first().actor.system.abilities.dex.mod
    effectData.changes.push({
        'key': 'system.attributes.ac.bonus',
        'mode': 2,
        'value': -dex,
        'priority': 20
    });
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = [
        'flail',
        'greatclub',
        'lighthammer',
        'mace',
        'maul',
        'morningstar',
        'warhammer'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Concussive Smash');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'concussiveSmash', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, [['Yes', true], ['No', false]], 'Use Concussive Smash?');
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
    let turn = effect.flags['chris-premades']?.feature?.concussiveSmash ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.concussiveSmash': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
export let concussiveSmash = {
    'item': item,
    'save': save,
    'attack': attack,
    'turn': turn
}