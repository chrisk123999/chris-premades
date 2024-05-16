import {chris} from '../../../helperFunctions.js';
let invalidTypes = [
    'cone',
    'cube',
    'cylinder',
    'line',
    'radious',
    'sphere',
    'square',
    'wall'
];
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.item.type != 'spell') return;
    if (invalidTypes.includes(workflow.item.system.target?.type)) return;
    let targetToken = args[0].options.token;
    let effectData = {
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': targetToken.actor.uuid,
        'duration': {
            'seconds': 1,
        },
        'name': 'Spell Turning',
        'changes': [
            {
                'key': 'flags.midi-qol.magicResistance.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            }
        }
    };
    await chris.createEffect(targetToken.actor, effectData);
}
async function late({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetToken = args[0].options.token;
    if (workflow.failedSaves.has(targetToken)) return;
    if (workflow.targets.size != 1 || workflow.item.type != 'spell') return;
    if (workflow.castData.baseLevel > 7) return;
    if (invalidTypes.includes(workflow.item.system.target?.type)) return;


}

export let spellTurning = {
    'early': early
};