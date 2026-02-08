import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function isAttacked({trigger: {token}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(token.actor, 'grappling');
    let grapples = grapplingEffects.map(i => token.scene.tokens.get(i.flags['chris-premades'].grapple.tokenId)?.object).filter(i => i);
    if (!grapples.length) return;
    if (grapples.some(g => g.id === workflow.token.id)) return;
    genericUtils.setProperty(workflow, 'chris-premades.grapples', grapples);
    await genericUtils.setFlag(token.actor, 'midi-qol', 'acBonus', 2);
}
async function isMissed({trigger: {entity: item, token}, workflow}) {
    let grapples = workflow['chris-premades']?.grapples;
    if (!grapples) return;
    await genericUtils.unsetFlag(token.actor, 'midi-qol', 'acBonus');
    if (workflow.hitTargets.some(t => t.id === token.id)) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let reaction = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!reaction) return;
    let moxie = itemUtils.getItemByIdentifier(token.actor, 'moxie');
    if (!moxie?.system.uses.value) return;
    let range = workflow.activity.range.value ?? workflow.activity.range.reach;
    let potentialTargets = grapples.filter(g => tokenUtils.getDistance(workflow.token, g) <= range);
    if (!potentialTargets.length) return;
    let target;
    let player = socketUtils.firstOwner(token, true);
    let selected = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Macros.CloudRune.Reaction', {item: item.name, name: workflow.actor.name}), potentialTargets, {userId: player});
    if (selected?.length) target = selected[0];
    if (!target) return;
    await workflowUtils.completeActivityUse(reaction, {midiOptions: {asUser: player}});
    await workflowUtils.syntheticActivityRoll(workflow.activity, [target]);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'moxie');
}
export let meatShield = {
    name: 'Meat Shield',
    version: '1.4.27',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: isAttacked,
                priority: 50
            },
            {
                pass: 'targetAttackRollComplete',
                macro: isMissed,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ]
};