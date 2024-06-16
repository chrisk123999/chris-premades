import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function antagonize({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = workflow.targets.first();
    let reaction = chris.findEffect(targetToken.actor, 'Reaction');
    let nearbyTargets;
    if (!reaction) {
        nearbyTargets = chris.findNearby(targetToken, 5, 'ally', true);
    }
    if (reaction || !nearbyTargets.length) {
        let effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 12
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.disadvantage.attack.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'specialDuration': [
                        'turnStartSource',
                        '1Attack'
                    ]
                }
            }
        }
        await chris.createEffect(targetToken.actor, effectData);
    } else {
        let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
        let weapon;
        if (!weapons.length) {
            chris.remoteDialog(workflow.item.name, [['Ok', true]], chris.lastGM(), 'Target does not have any weapons equipped!');
            return;
        } else if (weapons.length === 1) {
            weapon = weapons[0];
        } else {
            await chris.gmDialogMessage();
            [weapon] = await chris.remoteDocumentDialog(chris.lastGM(), 'What weapon is used to attack?', weapons);
            await chris.clearGMDialogMessage();
            if (!weapon) return;
        }
        let target;
        if (nearbyTargets.length === 1) {
            target = nearbyTargets[0].document;
        } else {
            let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, nearbyTargets, true, 'one', false, false, 'Who gets attacked?');
            if (!selection.buttons) return;
            let targetUuid = selection.inputs.find(i => i);
            if (!targetUuid) return;
            target = await fromUuid(targetUuid);
        }
        let [config , options] = constants.syntheticItemWorkflowOptions([target.uuid]);
        await warpgate.wait(100);
        await chris.remoteRollItem(weapon, config, options, chris.firstOwner(target).id);
    }
}