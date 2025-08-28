import {workflowUtils} from '../../../../utils.js';
import {proneOnFail} from '../../generic/proneOnFail.js';
async function use({trigger, workflow}) {
    let activities = workflow['chris-premades']?.cunningStrike?.activities;
    if (!activities) return;
    for (let activityUuid of activities) {
        let activity = await fromUuid(activityUuid);
        if (!activity) break;
        await workflowUtils.syntheticActivityRoll(activity, Array.from(workflow.targets));
    }
}
export let cunningStrike = {
    name: 'Cunning Strike',
    version: '1.3.32',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['trip']
            }
        ],
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 300,
                unique: 'cunningStrikeUse'
            }
        ]
    },
    config: [
        {
            value: 'uses',
            label: 'CHRISPREMADES.Config.SimultaneousUses',
            type: 'number',
            default: 1,
            category: 'homebrew',
            homebrew: true
        }
    ]
};