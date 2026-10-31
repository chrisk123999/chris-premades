import {actorUtils, activityUtils, dialogUtils, documentUtils, itemUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function slewTarget(workflow) {
    const [entry] = workflow.damageList ?? [];
    return workflow.hitTargets.size === 1 && entry && !entry.newHP && entry.oldHP ? entry : undefined;
}
async function bloodSpearKill({workflow}) {
    if (!slewTarget(workflow)) return;
    const {roll} = await rollUtils.rollDice('2d6', {document: workflow.actor, message: true, flavor: workflow.item.name});
    await workflowUtils.applyDamage([workflow.token.document], roll.total, 'temphp');
}
async function crystalHeal({document: item, workflow}) {
    if (workflow.activity.type !== 'attack' || workflow.hitTargets.size !== 1 || !item.system.uses.value) return;
    const radiant = workflow.damageList?.[0]?.damageDetail?.filter(detail => detail.type === 'radiant').reduce((total, detail) => total + detail.value, 0);
    const heal = itemUtils.getActivityByIdentifier(item, 'crystal-blade-heal');
    if (!radiant || !heal || !await dialogUtils.confirmUseItem(heal)) return;
    await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(heal, String(radiant)), item, [workflow.token.document]);
}
async function crystalLight({document: item, activity}) {
    const lights = {'crystal-blade-bright': 'crystalBladeBright', 'crystal-blade-dim': 'crystalBladeDim'};
    if (!lights[activity.identifier]) return;
    const current = Object.values(lights).map(identifier => actorUtils.getEffectByIdentifier(item.actor, identifier)).find(Boolean);
    if (!current) return;
    await documentUtils.deleteDocument(current);
    if (current.flags.cat.identifier === lights[activity.identifier]) return true;
}
async function dragonsWrathBurst({document: item, workflow}) {
    if (workflow.activity.type !== 'attack' || workflow.hitTargets.size !== 1 || workflow.d20AttackRoll !== 20) return;
    const burst = itemUtils.getActivityByIdentifier(item, 'dragons-wrath-critical');
    const nearby = tokenUtils.findNearby(workflow.hitTargets.first().document, 5, {disposition: 'ally'}).filter(token => token.actor);
    if (burst && nearby.length) await workflowUtils.syntheticActivityRoll(burst, nearby, {consumeUsage: false, consumeResources: false});
}
async function grovelthrashDamage({document: item, workflow}) {
    if (workflow.activity.type !== 'attack' || workflow.hitTargets.size !== 1) return;
    if (documentUtils.getIdentifier(item) === 'grovelthrash-exalted' && actorUtils.isBloodied(workflow.actor)) await workflowUtils.bonusDamage(workflow, '2d6', {damageType: 'bludgeoning'});
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.Grovelthrash.Damage'))) return;
    await workflowUtils.bonusDamage(workflow, '2d6', {damageType: 'bludgeoning'});
    const {roll} = await rollUtils.rollDice('1d6', {document: workflow.actor, message: true, flavor: item.name});
    await workflowUtils.applyDamage([workflow.token.document], roll.total, 'psychic');
}
async function grovelthrashReaction({document: item, targetToken: token, workflow, ditem}) {
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor) || !ditem.newHP || !workflow.token) return;
    if (tokenUtils.getDistance(token, workflow.token.document) > 30 || !tokenUtils.canSee(token, workflow.token.document)) return;
    const dealt = ditem.damageDetail.reduce((total, detail) => total + detail.value, 0);
    const reaction = itemUtils.getActivityByIdentifier(item, 'grovelthrash-reaction');
    if (!dealt || !reaction || !await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(reaction, String(dealt)), item, [workflow.token.document], {consumeUsage: true, consumeResources: true});
    await actorUtils.setReactionUsed(item.actor);
}
function ruinsWakeReaction({document: item, workflow}) {
    if (workflow.activity.identifier !== 'ruins-wake-reaction') return;
    workflow.tracker.advantage.add('ruins-wake', item.name);
}
async function ruinsWakeKill({document: item, workflow}) {
    if (workflow.activity.type !== 'attack') return;
    const entry = slewTarget(workflow);
    const heal = itemUtils.getActivityByIdentifier(item, 'ruins-wake-heal');
    if (!entry || !heal?.uses.value || !await dialogUtils.confirmUseItem(heal)) return;
    await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(heal, String(Math.floor(entry.totalDamage))), item, [workflow.token.document], {consumeUsage: true, consumeResources: true});
}
export const bloodSpear = {
    name: 'Blood Spear',
    version: '2.1.7',
    rules: '2014',
    roll: [{pass: 'itemRollFinished', macro: bloodSpearKill, priority: 50}]
};
export const crystalBlade = {
    name: 'Crystal Blade',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'itemPreTargeting', macro: crystalLight, priority: 50},
        {pass: 'itemRollFinished', macro: crystalHeal, priority: 50}
    ]
};
export const dragonsWrath = {
    name: 'Dragon\'s Wrath Weapon',
    version: '2.1.7',
    rules: '2014',
    roll: [{pass: 'itemRollFinished', macro: dragonsWrathBurst, priority: 50}]
};
export const grovelthrash = {
    name: 'Grovelthrash',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'itemDamageRollComplete', macro: grovelthrashDamage, priority: 50},
        {pass: 'targetDamageComplete', macro: grovelthrashReaction, priority: 50}
    ]
};
export const ruinsWake = {
    name: 'Ruin\'s Wake',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {pass: 'itemAttackRollConfig', macro: ruinsWakeReaction, priority: 50},
        {pass: 'itemRollFinished', macro: ruinsWakeKill, priority: 50}
    ]
};
