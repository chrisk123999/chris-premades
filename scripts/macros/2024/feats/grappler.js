import {constants, activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!workflow.targets.size) return;
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'grappling');
    if (!grapplingEffects.length) return;
    if (!grapplingEffects.some(i => i.flags['chris-premades'].grapple.tokenId === workflow.targets.first()?.id)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
}

async function hit({trigger: {entity: item}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (workflow.hitTargets.size !== 1) return;
    let unarmedStrikeItem = workflow.item;
    if (genericUtils.getIdentifier(unarmedStrikeItem) !== 'unarmedStrike') return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(unarmedStrikeItem.name, genericUtils.format('CHRISPREMADES.Macros.Grappler.Grapple', {tokenName: targetToken.name}));
    if (!selection) return;
    let grappleActivity = activityUtils.getActivityByIdentifier(unarmedStrikeItem, 'grapple', {strict: true});
    if (!grappleActivity) return;
    await workflowUtils.syntheticActivityRoll(grappleActivity, [targetToken]);
}

export let grappler = {
    name: 'Grappler',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: hit,
                priority: 50
            }
        ]
    }
};