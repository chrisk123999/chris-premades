import {chris} from '../../../helperFunctions.js';
async function postHit({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let target = workflow.hitTargets.first();
    let effectData = {
        'label': 'Grell Tentacles Grapple (Escape DC 15)',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 86400
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': 'Grappled',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'stackable': [
                    'noneName'
                ]
            }
        }
    }
    if (chris.getSize(target.actor) <= chris.sizeStringValue('medium')) {
        let restrainedData = {
            'key': 'macro.CE',
            'mode': 0,
            'value': 'Restrained',
            'priority': 20
        }
        effectData.changes.push(restrainedData);
    }
    await chris.createEffect(target.actor, effectData);
}
async function preHit({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let target = workflow.targets.first();
    let effect = chris.findEffect(target.actor, 'Grell Tentacles Grapple (Escape DC 15)');
    if (!effect) return;
    let effectData = {
        'label': 'Grell Tentacles Advantage',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'seconds': 6
        },
        'changes': [
            {
                'key': 'flags.midi-qol.advantage.attack.mwak',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    '1Attack'
                ]
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
}
export let tentacles = {
    postHit: postHit,
    preHit: preHit
}