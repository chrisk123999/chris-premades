import {constants, activityUtils, combatUtils, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflow.targets.size) return;
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'grappling');
    if (!grapplingEffects.length) return;
    if (!grapplingEffects.some(i => i.flags['chris-premades'].grapple.tokenId === workflow.targets.first()?.id)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
}

async function hit({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.hitTargets.size !== 1) return;
    if (!combatUtils.perTurnCheck(item, 'grapplerModern')) return;
    let unarmedStrikeItem = workflow.item;
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(unarmedStrikeItem))) return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(unarmedStrikeItem.name, genericUtils.format('CHRISPREMADES.Macros.Grappler.Grapple', {tokenName: targetToken.name}));
    if (!selection) return;
    let grappleActivity = activityUtils.getActivityByIdentifier(unarmedStrikeItem, 'grapple', {strict: true});
    if (!grappleActivity) return;
    await combatUtils.setTurnCheck(item, 'grapplerModern');
    await workflowUtils.syntheticActivityRoll(grappleActivity, [targetToken]);
}

export let grapplerModern = {
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