import {constants, tokenUtils} from '../../../utils.js';
async function attacked({trigger, workflow}) {
    if (!workflow.targets.size || !constants.attacks.includes(workflow.activity.actionType) || !workflow.token) return;
    if (tokenUtils.canSense(workflow.targets.first(), workflow.token, ['feelTremor', 'seeInvisbility', 'blindsight', 'seeAll', 'senseAll', 'senseInvisibility'])) return;
    workflow.disadvantage = true;
    workflow.rollOptions.disadvantage = true;
    workflow.attackAdvAttribution.add('DIS: ' + trigger.entity.name);
}
async function attacking({trigger, workflow}) {
    if (!workflow.targets.size || !constants.attacks.includes(workflow.activity.actionType) || !workflow.token) return;
    if (tokenUtils.canSense(workflow.targets.first(), workflow.token, ['feelTremor', 'seeInvisbility', 'blindsight', 'seeAll', 'senseAll', 'senseInvisibility'])) return;
    workflow.advantage = true;
    workflow.rollOptions.advantage = true;
    workflow.attackAdvAttribution.add('ADV: ' + trigger.entity.name);
}
export let invisible = {
    name: 'Invisible',
    version: '1.1.17',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: attacked,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: attacking,
                priority: 50
            }
        ]
    }
};