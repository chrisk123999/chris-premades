import {chris} from '../../helperFunctions.js'
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog(workflow.item.name, [['Lower Planes', 'lower'], ['Upper Planes', 'upper']], 'What planes do you draw magic from?');
    if (!selection) return;
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'system.traits.di.value',
                'mode': 0,
                'value': 'fire',
                'priority': 20
            },
            {
                'key': 'system.traits.di.value',
                'mode': 0,
                'value': 'poison',
                'priority': 20
            },
            {
                'key': 'system.traits.ci.value',
                'mode': 0,
                'value': 'poisoned',
                'priority': 20
            },
            {
                'key': 'system.attributes.movement.fly',
                'mode': 4,
                'value': '40',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.tashasOtherworldlyGuise.attack,preambleComplete',
                'priority': 20
            },
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+2',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'tashasOtherworldlyGuise': workflow.item.system.save.scaling
                }
            }
        }
    };
    if (selection === 'upper') {
        effectData.changes[0].value = 'radiant';
        effectData.changes[1].value = 'necrotic';
        effectData.changes[3].value = 'charmed';
    }
    await chris.createEffect(workflow.actor, effectData);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'weapon') return;
    let effect = workflow.actor.effects.find(i => i.flags['chris-premades']?.spell?.tashasOtherworldlyGuise);
    if (!effect) return;
    let scaling = effect.flags['chris-premades'].spell.tashasOtherworldlyGuise;
    if (scaling === 'spell') scaling = workflow.actor.system.attributes.spellcasting;
    let itemScaling = workflow.item.system.ability;
    if (!itemScaling) itemScaling = 'str';
    let queueSetup = await queue.setup(workflow.item.uuid, 'tashasOtherworldlyGuise', 50);
    if (!queueSetup) return;
    let properties = duplicate(workflow.item.system.properties);
    properties.mgc = true;
    let ability = duplicate(workflow.item.system.ability);
    if (workflow.actor.system.abilities[itemScaling].mod < workflow.actor.system.abilities[scaling].mod) ability = scaling;
    workflow.item = workflow.item.clone({'system.properties': properties, 'system.ability': ability}, {'keepId': true});
    queue.remove(workflow.item.uuid);
}
export let tashasOtherworldlyGuise = {
    'item': item,
    'attack': attack
}