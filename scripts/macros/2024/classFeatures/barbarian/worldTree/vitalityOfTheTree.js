import {activityUtils, actorUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {rage} from '../rage.js';
async function turnStart({trigger: {entity: effect}}) {
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token);
    let range = effect.flags['chris-premades']?.vitalityOfTheTree?.range;
    if (!range) return;
    let nearbyAllies = tokenUtils.findNearby(token, range, 'ally', {includeIncapacitated: true});
    if (!nearbyAllies.length) return;
    let feature = itemUtils.getItemByIdentifier(effect.parent, 'vitalityOfTheTree');
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'lifeGivingForce');
    if (!activity) return;
    let selection;
    if (nearbyAllies.length === 1) {
        selection = nearbyAllies[0];
    } else {
        let targetSelection = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.VitalityOfTheTree', nearbyAllies, {skipDeadAndUnconscious: false});
        if (!targetSelection?.length) return;
        selection = targetSelection[0];
    }
    await workflowUtils.syntheticActivityRoll(activity, [selection]);
}
export let vitalityOfTheTree = {
    name: 'Vitality of the Tree',
    version: '1.1.26',
    rules: 'modern',
    config: [
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'text',
            default: 10,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'rage-damage',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: rage.scales
};
export let lifeGivingForce = {
    name: 'Life-Giving Force',
    version: '1.1.26',
    rules: 'modern',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};