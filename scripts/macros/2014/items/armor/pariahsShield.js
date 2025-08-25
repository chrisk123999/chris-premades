import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function moved({trigger}) {
    await Promise.all(trigger.token.document.parent.tokens.map(async i => {
        if (!i.actor) return;
        let item = itemUtils.getItemByIdentifier(i.actor, 'pariahsShield');
        if (!item) return;
        let range = Number(itemUtils.getConfig(item, 'range'));
        let nearbyAllies = tokenUtils.findNearby(i, range, 'ally', {includeIncapacitated: true});
        let currentBonus = item.system.armor.magicalBonus ?? 0;
        if (nearbyAllies.length === currentBonus) return;
        let maxBonus = Number(itemUtils.getConfig(item, 'maxBonus'));
        await genericUtils.update(item, {'system.armor.magicalBonus': Math.min(Math.floor(nearbyAllies.length / 2), maxBonus)});
    }));
}
async function damage({trigger, workflow, ditem}) {
    if (!workflow.hitTargets.size) return;
    if (['healing', 'temphp'].includes(workflow.defaultDamageType)) return;
    let sourceToken = workflow.token;
    let targetToken = trigger.targetToken;
    if (sourceToken.document.uuid === targetToken.document.uuid) return;
    let nearbyAllies = tokenUtils.findNearby(targetToken, 5, 'ally').filter(i => {
        let item = itemUtils.getItemByIdentifier(i.actor, 'pariahsShield');
        if (!item) return;
        if (!itemUtils.getEquipmentState(item)) return;
        if (combatUtils.inCombat() && actorUtils.hasUsedReaction(i.actor)) return;
        let distance = tokenUtils.getDistance(targetToken, i);
        if (distance > genericUtils.handleMetric(5)) return;
        return true;
    });
    if (!nearbyAllies.length) return;
    for (let i of nearbyAllies) {
        let item = itemUtils.getItemByIdentifier(i.actor, 'pariahsShield');
        let userId = socketUtils.firstOwner(i.document, true);
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.PariahsShield.Protect', {name: targetToken.name, item: item.name}), {userId: userId});
        if (!selection) continue;
        let damage = ditem.hpDamage + ditem.tempDamage;
        workflowUtils.negateDamageItemDamage(ditem);
        let activity = activityUtils.getActivityByIdentifier(trigger.entity, 'pariahsShieldProtect', {strict: true});
        if (!activity) return;
        let activityData = activityUtils.withChangedDamage(activity, damage);
        await workflowUtils.syntheticActivityDataRoll(activityData, trigger.entity, trigger.entity.actor, [i]);
        break;
    }
}
export let pariahsShield = {
    name: 'Pariah\'s Shield',
    version: '1.3.10',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damage,
                priority: 150
            }
        ]
    },
    movement: [
        {
            pass: 'movedScene',
            macro: moved,
            priority: 50
        }
    ],
    config: [
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'text',
            default: 5,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'maxBonus',
            label: 'CHRISPREMADES.Macros.PariahsShield.MaxBonus',
            type: 'text',
            default: 3,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};