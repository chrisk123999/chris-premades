import {actorUtils, automationUtils, dialogUtils, genericUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
export async function transferHalfDamage(ditem, wearerToken, guardianToken, maxDistance) {
    if (!wearerToken.object || !guardianToken.object || !tokenUtils.isWithinDistance(wearerToken, guardianToken, maxDistance, {wallsBlock: false, checkCover: false})) return;
    const transfer = Math.ceil(ditem.totalDamage / 2);
    workflowUtils.setDamageItemDamage(ditem, ditem.totalDamage - transfer);
    await workflowUtils.applyDamage([guardianToken], transfer, 'none');
}
async function bind({document: item, workflow}) {
    if (workflow.activity.identifier !== 'bind') return;
    const actor = workflow.targets.documents[0]?.actor;
    if (!actor) return;
    await automationUtils.setConfigValue(item, 'target', actor.uuid);
    genericUtils.notify('CHRISPREMADES.Macros.Modern.ShieldGuardian.Bound', {format: {name: actor.name}});
}
async function damaged({document: item, ditem, targetToken}) {
    if (!ditem.isHit || ditem.totalDamage <= 0 || targetToken.actor?.uuid !== automationUtils.getConfigValue(item, 'target')) return;
    const guardianToken = actorUtils.getFirstToken(item.actor);
    if (guardianToken) await transferHalfDamage(ditem, targetToken, guardianToken, automationUtils.getConfigValue(item, 'distance'));
}
async function protect({document: item, workflow}) {
    if (!workflow.attackRoll || workflow.attackRoll.isCritical || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const bound = actorUtils.getItemByIdentifier(item.actor, 'bound');
    const wearerUuid = bound && automationUtils.getConfigValue(bound, 'target');
    const wearer = wearerUuid && workflow.targets.documents.find(token => token.actor?.uuid === wearerUuid);
    if (!wearer || workflow.attackTotal < wearer.actor.system.attributes.ac.value) return;
    const token = actorUtils.getFirstToken(item.actor);
    if (!token || (token.inCombat && actorUtils.hasUsedReaction(item.actor)) || !wearer.object || !tokenUtils.isWithinDistance(token, wearer, 5)) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.ShieldGuardian.Protect', {item: item.name, name: wearer.name}), {userId})) return;
    await workflowUtils.syntheticItemRoll(item, [wearer], {userId});
    if (token.inCombat) await actorUtils.setReactionUsed(item.actor);
    workflowUtils.addTargetAC(workflow, wearer.actor, 5);
}
export const shieldGuardianBound = {
    name: 'Bound',
    version: '2.1.8',
    rules: '2024',
    monsterIdentifier: 'shield-guardian',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: bind,
            priority: 50
        },
        {
            pass: 'sceneDamageFlatReductions',
            macro: damaged,
            priority: 250
        }
    ],
    config: {
        target: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.ShieldGuardian.Wearer',
            category: 'mechanics'
        },
        distance: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        }
    }
};
export const shieldGuardianProtection = {
    name: 'Protection',
    version: shieldGuardianBound.version,
    rules: shieldGuardianBound.rules,
    monsterIdentifier: shieldGuardianBound.monsterIdentifier,
    roll: [
        {
            pass: 'sceneAttackRoll',
            macro: protect,
            priority: 100
        }
    ]
};
