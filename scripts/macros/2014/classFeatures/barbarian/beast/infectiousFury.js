import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!item?.system.uses.value) return;
    let isNatural = workflow.item.system.type?.value === 'natural';
    isNatural ||= activityUtils.getIdentifier(workflow.activity)?.includes('formOfTheBeast');
    if (!isNatural) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.hitTargets.first()]);
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
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', [targetToken], {flavor: workflow.item.name, itemCardId: workflow.itemCardId, sourceItem: workflow.item});
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
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};