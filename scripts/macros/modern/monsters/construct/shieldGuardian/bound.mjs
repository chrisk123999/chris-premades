import {activityUtils, actorUtils, automationUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function bind({document, workflow}) {
    if (!workflow.targets.size) return;
    await automationUtils.setConfigValue(document, 'target', workflow.targets.first().actor.uuid);
}
async function damaged({document, ditem, targetToken}) {
    if (!ditem.isHit || ditem.damageDetail[0]?.type === 'none' || (ditem.oldHP <= ditem.newHP && ditem.newTempHP >= ditem.oldTempHP)) return;
    const targetUuid = automationUtils.getConfigValue(document.item, 'target');
    if (targetToken.actor.uuid !== targetUuid) return;
    const guardianToken = actorUtils.getFirstToken(document.actor);
    if (!guardianToken) return;
    const distance = tokenUtils.getDistance(guardianToken, targetToken, {wallsBlock: false, checkCover: false});
    const maxDistance = automationUtils.getConfigValue(document.item, 'distance');
    if (distance > maxDistance) return;
    const transferDamage = Math.ceil(ditem.totalDamage / 2);
    const remainingDamage = ditem.totalDamage - transferDamage;
    workflowUtils.setDamageItemDamage(ditem, remainingDamage);
    const activityData = activityUtils.getDamageModifiedActivityData(document, String(transferDamage));
    await workflowUtils.syntheticActivityDataRoll(activityData, document, [guardianToken]);
}
export const shieldGuardianBound = {
    name: 'Bound',
    version: '2.0.3',
    rules: '2024',
    monsterIdentifier: 'shield-guardian',
    config: {
        distance: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            hint: ''
        },
        target: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.Target',
            hint: ''
        }
    }
};
export const shieldGuardianBoundBind = {
    name: 'Bound: Bind',
    version: shieldGuardianBound.version,
    rules: shieldGuardianBound.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: bind,
            priority: 50
        }
    ]
};
export const shieldGuardianBoundDamage = {
    name: 'Bound: Damage',
    version: shieldGuardianBound.version,
    rules: shieldGuardianBound.rules,
    roll: [
        {
            pass: 'sceneDamageFlatReductions',
            macro: damaged,
            priority: 250
        }
    ]
};