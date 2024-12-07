import {genericUtils, tokenUtils} from '../../utils.js';
async function attack({trigger, workflow}) {
    let baseItem = workflow.item.system.type?.baseItem;
    switch (workflow.activity.actionType) {
        case 'mwak': {
            if (workflow.actor.system.attributes.movement.swim > 0) return;
            let validMeleeTypes = [
                'dagger',
                'javelin',
                'shortsword',
                'spear',
                'trident'
            ];
            if (validMeleeTypes.includes(baseItem)) return;
            break;
        }
        case 'rwak': {
            let validRangedTypes = [
                'lightcrossbow',
                'handcrossbow',
                'heavycrossbow',
                'net',
                'javelin',
                'spear',
                'trident',
                'dart'
            ];
            if (validRangedTypes.includes(baseItem)) return;
            break;
        }
        default:
            return;
    }
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Underwater');
    workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Macros.Underwater.Underwater'));
}
async function range({trigger, workflow}) {
    if (workflow.targets.size != 1) return;
    if (workflow.activity.actionType != 'rwak') return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.targets.first());
    if (distance <= (workflow.activity.range.value ?? workflow.activity.range.reach)) return;
    genericUtils.notify('CHRISPREMADES.Macros.Underwater.TooFar', 'warn');
    return true;
}
export let underwater = {
    name: 'Underwater',
    version: '1.1.0'
};
export let underwaterEffect = {
    name: underwater.name,
    version: underwater.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 1
            },
            {
                pass: 'preItemRoll',
                macro: range,
                priority: 1
            }
        ]
    }
};