import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function check(maxTargets, workflow) {
    if (workflow.targets.size <= maxTargets) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'upcastTargets', 40);
    if (!queueSetup) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await chris.selectTarget(workflow.item.name, constants.okCancel, oldTargets, false, 'multiple', undefined, false, 'Too many targets selected! Please select up to ' + maxTargets + ' targets.');
    if (!selection.buttons) {
        newTargets = oldTargets.map(i => i.id);
        newTargets.length = maxTargets;
    } else {
        newTargets = selection.inputs.filter(i => i);
        if (newTargets.length > maxTargets) {
            newTargets.length = maxTargets;
            ui.notifications.warn('Too many targets selected, some targets have been removed!');
        }
    }
    chris.updateTargets(newTargets);
    queue.remove(workflow.item.uuid);
}
async function plusOne({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 1;
    await check(maxTargets, workflow);
}
async function plusTwo({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 2;
    await check(maxTargets, workflow);
}
async function plusThree({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 3;
    await check(maxTargets, workflow);
}
async function plusFour({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 4;
    await check(maxTargets, workflow);
}
export let upcastTargets = {
    'check': check,
    'plusOne': plusOne,
    'plusTwo': plusTwo,
    'plusThree': plusThree,
    'plusFour': plusFour
};