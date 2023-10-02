import {chris} from '../../helperFunctions.js';
async function targets(condition, workflow) {
    if (!workflow.targets.size) return;
    let effectData = {
        'label': 'Immune',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'mode': 5,
                'value': '99',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ],
            }
        }
    };
    for (let i of workflow.targets) {
        if (chris.checkTrait(i.actor, 'ci', condition)) await chris.createEffect(i.actor, effectData);
    }
}
async function blinded({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('blinded', workflow);
}
async function charmed({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('charmed', workflow);
}
async function deafened({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('deafened', workflow);
}
async function diseased({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('diseased', workflow);
}
async function frightened({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('frightened', workflow);
}
async function grappled({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('grappled', workflow);
}
async function incapacitated({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('incapacitated', workflow);
}
async function invisible({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('invisible', workflow);
}
async function paralyzed({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('paralyzed', workflow);
}
async function peterified({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('peterified', workflow);
}
async function poisoned({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('poisoned', workflow);
}
async function prone({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('prone', workflow);
}
async function restrained({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('restrained', workflow);
}
async function stunned({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('stunned', workflow);
}
async function unconscious({speaker, actor, token, character, item, args, scope, workflow}) {
    await targets('unconscious', workflow);
}
export let saveConditionImmune = {
    'blinded': blinded,
    'charmed': charmed,
    'deafened': deafened,
    'diseased': diseased,
    'frightened': frightened,
    'grappled': grappled,
    'incapacitated': incapacitated,
    'invisible': invisible,
    'paralyzed': paralyzed,
    'peterified': peterified,
    'poisoned': poisoned,
    'prone': prone,
    'restrained': restrained,
    'stunned': stunned,
    'unconscious': unconscious
}