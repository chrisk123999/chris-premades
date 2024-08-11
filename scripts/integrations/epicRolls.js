import {genericUtils, socketUtils} from '../utils.js';
async function contestedCheck(actor, contestantActor, type, contestedType) {
    let autoRollUuids = [];
    if (socketUtils.firstOwner(actor).isGM) autoRollUuids.push(actor.uuid);
    if (socketUtils.firstOwner(contestantActor).isGM) autoRollUuids.push(contestantActor.uuid);
    return await ui.EpicRolls5e.requestRoll({
        actors: [actor.uuid],
        contestants: [contestantActor.uuid],
        type: type,
        contest: contestedType,
        options: {
            showRollResults: true,
            autoColor: true,
            hideNames: genericUtils.getCPRSetting('hideNames'),
            rollSettings: {
                autoRoll: autoRollUuids //This doesn't appear to work.
            }
        }
    });
}
export let epicRolls = {
    contestedCheck
};