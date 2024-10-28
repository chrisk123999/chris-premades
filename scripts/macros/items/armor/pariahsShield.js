import {actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
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
        await genericUtils.update(item, {'system.armor.magicalBonus': Math.min(nearbyAllies.length, maxBonus)});
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
        if (distance > 5) return;
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
        let itemData = await compendiumUtils.getItemFromCompendium(constants.packs.itemFeatures, 'Pariah\'s Shield: Protect', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.PariahsShield.Reaction'});
        if (!itemData) return;
        itemData.system.damage.parts[0][0] = damage;
        await workflowUtils.syntheticItemDataRoll(itemData, i.actor, [i]);
        break;
    }
}
export let pariahsShield = {
    name: 'Pariah\'s Shield',
    version: '0.12.51',
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