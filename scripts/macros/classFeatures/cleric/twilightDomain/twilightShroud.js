import {constants} from '../../../../constants.js'
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack(workflow) {
    if (workflow.targets.size != 1 || !workflow.item || !constants.attacks.includes(workflow.item.system.actionType)) return;
    let targetToken = workflow.targets.first();
    let coverBonus = MidiQOL.computeCoverBonus(workflow.token, targetToken, workflow.item);
    if (coverBonus >= 2) return;
    let nearbyShrouds = chris.findNearby(targetToken, 30, 'ally', false, true).filter(i => chris.findEffect(i.actor, 'Channel Divinity: Twilight Sanctuary') && chris.getItem(i.actor, 'Twilight Shroud'));
    if (!nearbyShrouds.length) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'twilightShroud', 150);
    if (!queueSetup) return;
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, -2);
    let feature = chris.getItem(nearbyShrouds[0].actor, 'Twilight Shroud');
    workflow.attackAdvAttribution.add('Half-Cover: ' + feature.name);
    workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}
let saveTargets = [];
async function saveEarly(workflow) {
    if (workflow.item?.system?.save?.ability != 'dex' || !workflow.targets.size) return;
    let effectData = {
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'name': 'Dex Cover Bonus',
        'changes': [
            {
                'key': 'system.abilities.dex.bonuses.save',
                'mode': 2,
                'value': '+2',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    for (let i of workflow.targets) {
        let nearbyShrouds = chris.findNearby(i, 30, 'ally', false, true).filter(i => chris.findEffect(i.actor, 'Channel Divinity: Twilight Sanctuary') && chris.getItem(i.actor, 'Twilight Shroud'));
        if (!nearbyShrouds.length) continue;
        await chris.createEffect(i.actor, effectData);
        saveTargets.push(i.actor);
    }
}
async function saveLate(workflow) {
    if (workflow.item?.system?.save?.ability != 'dex' || !workflow.targets.size) return;
    for (let i of saveTargets) {
        let effect = chris.findEffect(i, 'Dex Cover Bonus');
        if (effect) await chris.removeEffect(effect);
    }
    saveTargets = [];
}
export let twilightShroud = {
    'attack': attack,
    'saveEarly': saveEarly,
    'saveLate': saveLate
}