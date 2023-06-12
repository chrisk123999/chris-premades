import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor || !workflow.token) return;
    let effect = chris.findEffect(workflow.actor, 'Concentrating');
    if (effect) chris.removeEffect(effect);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Rage - End', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rage - End');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Rage');
    }
    let effectData = {
        'changes': [
            {
                'key': 'flags.midi-qol.advantage.ability.check.str',
                'mode': 0,
                'value': '1',
                'priority': 0
            },
            {
                'key': 'flags.midi-qol.advantage.ability.save.str',
                'mode': 0,
                'value': '1',
                'priority': 0
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'slashing',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'piercing',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'bludgeoning',
                'priority': 20
            },
            {
                'key': 'system.bonuses.mwak.damage',
                'mode': 2,
                'value': '+ @scale.barbarian.rage-damage',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.vocal',
                'value': '1',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.somatic',
                'value': '1',
                'mode': 0,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.spell.material',
                'value': '1',
                'mode': 0,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 60
        },
        'icon': workflow.item.img,
        'label': workflow.item.name,
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    }
    let totem = workflow.actor.flags['chris-premades']?.feature?.totemSpirit;
    if (totem === 'bear') {
        effectData.changes = effectData.changes.concat([
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'acid',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'cold',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'fire',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'force',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'lightning',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'necrotic',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'poison',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'radiant',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'thunder',
                'priority': 20
            }
        ]);
    }
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Rage',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function end({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor) return;
    let effect = chris.findEffect(workflow.actor, 'Rage');
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    //todo: Automate keeping track of attacks and being attacked.
}
async function attacked({speaker, actor, token, character, item, args, scope, workflow}) {

}
export let rage = {
    'item': item,
    'end': end
}