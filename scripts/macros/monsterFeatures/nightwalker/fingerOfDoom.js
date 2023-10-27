import {chris} from '../../../helperFunctions.js';
async function target({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.get(workflow.token.document.actorId);
    if (!sourceActor) return;
    let monsterName = sourceActor.name.split(' ').join('-').toLowerCase();
    let featureName = workflow.item.name.split(' ').join('-').toLowerCase();
    let validTargets = Array.from(workflow.targets).filter(i => !i.actor.flags['chris-premades']?.monster?.[monsterName]?.feature?.[featureName]?.immune).map(i => i.id);
    chris.updateTargets(validTargets);
}
async function save({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.get(workflow.token.document.actorId);
    if (!sourceActor) return;
    let monsterName = sourceActor.name.split(' ').join('-').toLowerCase();
    let featureName = workflow.item.name.split(' ').join('-').toLowerCase();
    let effectData1 = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': 'Frightened',
                'priority': 20
            },
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': 'Paralyzed',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnEndSource'
                ]
            }
        }
    };
    let effectData2 = {
        'label': workflow.item.name + ' Immune',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 86400
        },
        'changes': [
            {
                'key': 'flags.chris-premades.monster.' + monsterName + '.feature.' + featureName + '.immune',
                'mode': 5,
                'value': 1,
                'priority': 20
            }
        ]
    }
    for (let i of workflow.targets) {
        if (workflow.failedSaves.has(i)) {
            let effect = chris.findEffect(i.actor, effectData1.label);
            if (effect) {
                await chris.updateEffect(effect, {'duration.seconds': effectData1.duration.seconds});
            } else {
                if (!chris.checkTrait(i.actor, 'ci', 'frightened')) await chris.createEffect(i.actor, effectData1);
            }
        } else {
            let effect = chris.findEffect(i.actor, effectData2.label);
            if (effect) {
                await chris.updateEffect(effect, {'duration.seconds': effectData2.duration.seconds});
            } else {
                await chris.createEffect(i.actor, effectData2);
            }
        }
    }
}
export let fingerOfDoom = {
    'target': target,
    'save': save
}