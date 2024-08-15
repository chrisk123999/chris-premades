import {actorUtils, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function attack({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'infectiousFury');
    if (!feature || !feature.system.uses.value) return;
    let selection = await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: feature.name}));
    if (!selection) return;
    await genericUtils.update(feature, {'system.uses.value': feature.system.uses.value - 1});
    await workflowUtils.syntheticItemRoll(feature, [workflow.hitTargets.first()]);
}
async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = workflow.failedSaves.first();
    let nearbyTargets;
    let usedReaction = actorUtils.hasUsedReaction(targetToken.actor);
    if (!usedReaction) {
        nearbyTargets = tokenUtils.findNearby(targetToken, 5, 'ally', {});
    }
    let selection;
    if (usedReaction || !nearbyTargets.length) {
        selection = 'damage';
    } else {
        selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfectiousFury.Curse', [
            ['CHRISPREMADES.Macros.InfectiousFury.Attack', 'attack'],
            ['CHRISPREMADES.Macros.InfectiousFury.Damage', 'damage']
        ]);
    }
    if (!selection) return;
    if (selection === 'damage') {
        let damageRoll = await new CONFIG.Dice.DamageRoll('2d12[psychic]', {}, {damageType: 'psychic'}).evaluate();
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', [targetToken], {flavor: workflow.item.name, itemCardId: workflow.itemCardId});
    } else {
        let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
        let selectedWeapon;
        if (!weapons.length) {
            genericUtils.notify('CHRISPREMADES.Macros.Antagonize.NoWeapons', 'info');
            return;
        }
        if (weapons.length === 1) {
            selectedWeapon = weapons[0];
        } else {
            selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Antagonize.SelectWeapon', weapons, {userId: socketUtils.gmID()});
            if (!selectedWeapon) return;
        }
        let target;
        let selected;
        if (nearbyTargets.length === 1) {
            target = nearbyTargets[0].document;
        } else {
            [{document: target}, selected] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Antagonize.SelectTarget', nearbyTargets);
            if (!selected) return;
        }
        await socketUtils.remoteRollItem(selectedWeapon, {}, {targetUuids: [target.uuid]}, socketUtils.firstOwner(targetToken).id);
        await actorUtils.setReactionUsed(targetToken.actor);
    }
}
export let infectiousFury = {
    name: 'Infectious Fury',
    version: '0.12.15',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let infectiousFuryAttack = {
    name: 'Infectious Fury: Attack',
    version: infectiousFury.version,
    midi: {
        item: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};