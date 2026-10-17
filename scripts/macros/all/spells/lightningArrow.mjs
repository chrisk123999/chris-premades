import {automationUtils, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function applies(workflow) {
    return workflow.targets.size === 1 && workflow.item.type === 'weapon' && workflowUtils.isAttackType(workflow, 'rangedAttack');
}
function prime({workflow}) {
    if (applies(workflow)) genericUtils.setProperty(workflow, 'workflowOptions.autoRollDamage', 'always');
}
async function replace({document: effect, workflow}) {
    if (!applies(workflow)) return;
    const castLevel = documentUtils.getSavedCastData(effect).castLevel || 3;
    const roll = await rollUtils.damageRoll((castLevel + 1) + 'd8 + @mod', workflow.activity, {type: 'lightning'});
    await workflow.setDamageRolls([roll]);
}
async function burst({document: effect, workflow}) {
    if (!applies(workflow)) return;
    const target = workflow.targets.first();
    if (!workflow.hitTargets.size) await workflowUtils.applyDamage([target.document], Math.floor((workflow.damageRolls?.[0]?.total ?? 0) / 2), 'lightning');
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'lightning-arrow-burst') : undefined;
    const nearby = tokenUtils.findNearby(target.document, 10);
    if (item) {
        const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
        animation?.macros?.play?.(workflow.token?.document, target.document, options);
    }
    await documentUtils.deleteDocument(effect);
    if (activity && nearby.length) await workflowUtils.syntheticActivityRoll(activity, nearby, {atLevel: documentUtils.getSavedCastData(effect).castLevel || undefined, consumeUsage: false, consumeResources: false, spellSlot: false});
}
export const lightningArrow = {
    name: 'Lightning Arrow',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'actorPreItemRoll', macro: prime, priority: 50},
        {pass: 'actorDamageRoll', macro: replace, priority: 50},
        {pass: 'actorRollFinished', macro: burst, priority: 50}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
