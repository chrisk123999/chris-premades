import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'pommelStrike', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) {
        workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
        workflow.item.prepareData();
        workflow.item.prepareFinalAttributes();
    }
    queue.remove(workflow.item.uuid);
}
async function save({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size === 1 && workflow.hitTargets.size === 1) {
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
                'seconds': 12
            },
            'origin': workflow.item.uuid,
            'flags': {
                'effectmacro': {
                    'onTurnEnd': {
                        'script': 'await chrisPremades.macros.bg3.pommelStrike.turn(effect);'
                    }
                },
                'chris-premades': {
                    'feature': {
                        'pommelStrike': 0
                    }
                }
            }
        };
        let armorTypes = [
            'light',
            'medium',
            'heavy'
        ];
        let armor = workflow.targets.first().actor.items.find(i => armorTypes.includes(i.system.type.value) && i.system.equipped);
        let dex = armor?.system?.armor?.dex ?? workflow.targets.first().actor.system.abilities.dex.mod
        if (dex > 0) {
            effectData.changes.push({
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': -dex,
                'priority': 20
            });
        }
        await chris.createEffect(workflow.targets.first().actor, effectData);
    }
    if (workflow.hitTargets.size != 1 || workflow.damageList[0].newHP != 0 || workflow.damageList[0].oldHP === 0) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Dead');
    if (!effect) return;
    await chris.removeEffect(effect);
    await chris.addCondition(workflow.targets.first().actor, 'Unconscious', true);
}
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.pommelStrike ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.pommelStrike': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
export let pommelStrike = {
    'item': item,
    'save': save,
    'turn': turn
}