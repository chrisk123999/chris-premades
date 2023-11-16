import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
let type = 'enervating';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'metallicBreathWeapon', 50);
    if (!queueSetup) return;
    type = await chris.dialog(workflow.item.name, [['Enervating Breath', 'enervating'], ['Repulsion Breath', 'repulsion']]) ?? 'enervating';
    let ability = duplicate(workflow.item.system.save.ability);
    if (type === 'enervating') {
        ability = 'con';
    } else {
        ability = 'str';
    }
    workflow.item = workflow.item.clone({'system.save.ability': ability}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}
async function save({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.failedSaves.size) return;
    if (type === 'enervating') {
        let effectData = {
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
                    'value': 'Incapacitated',
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'specialDuration': [
                        'turnStartSource'
                    ]
                }
            }
        };
        for (let i of Array.from(workflow.failedSaves)) await chris.createEffect(i.actor, effectData);
    } else {
        let queueSetup = await queue.setup(workflow.item.uuid, 'metallicBreathWeaponSave', 50);
        if (!queueSetup) return;
        for (let i of Array.from(workflow.failedSaves)) {
            chris.pushToken(workflow.token, i, 20);
            if (!(chris.checkTrait(i.actor, 'ci', 'prone') || chris.findEffect(i.actor, 'Prone'))) chris.addCondition(i.actor, 'Prone', false, workflow.item.uuid);
        }
        queue.remove(workflow.item.uuid);
    }
}
export let metallicBreathWeapon = {
    'item': item,
    'save': save
}