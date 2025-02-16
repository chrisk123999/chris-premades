import {activityUtils, constants, effectUtils} from '../../../../../utils.js';
async function attacked({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!effect.origin) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item?.system?.uses?.value) return;
    let activity = activityUtils.getActivityByIdentifier('save');
    //Finish this
}

export let unbreakableMajesty = {
    name: 'Unbreakable Majesty',
    version: '1.1.41',
    rules: 'modern'
};