import {activityUtils, dialogUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';

async function late({workflow}) {
    if (!workflow.targets.size) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.NaturesWrath.Select', [
        ['DND5E.AbilityStr', 'str'],
        ['DND5E.AbilityDex', 'dex']
    ], {userId: socketUtils.firstOwner(workflow.targets.first(), true)});
    let featureIdentifier = (!selection || selection === 'str') ? 'naturesWrathStr' : 'naturesWrathDex';
    let feature = activityUtils.getActivityByIdentifier(workflow.item, featureIdentifier, {stricT: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, Array.from(workflow.targets));
}
export let naturesWrath = {
    name: 'Channel Divinity: Nature\'s Wrath',
    version: '1.2.21',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['naturesWrath']
            }
        ]
    }
};