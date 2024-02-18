import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let baseItem = workflow.item.system.type?.baseItem;
    switch (workflow.item.system.actionType) {
        case 'mwak':
            if (workflow.actor.system.attributes.movement.swim > 0) return;
            let validMeleeTypes = [
                'dagger',
                'javelin',
                'shortsword',
                'spear',
                'trident'
            ]
            if (validMeleeTypes.includes(baseItem)) return;
            break;;
        case 'rwak':
            let validRangedTypes = [
                'lightcrossbow',
                'handcrossbow',
                'heavycrossbow',
                'net',
                'javelin',
                'spear',
                'trident',
                'dart'
            ]
            if (validRangedTypes.includes(baseItem)) return;
            break;
        default:
            return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'underwater', 1);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Underwater');
    queue.remove(workflow.item.uuid);
}
async function range({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (workflow.item.system.actionType != 'rwak') return;
    let distance = chris.getDistance(workflow.token, workflow.targets.first());
    if (distance <= workflow.item.system.range.value) return
    ui.notifications.info('Target is too far away while underwater!')
    return false;
}
export let underwater = {
    'attack': attack,
    'range': range
}