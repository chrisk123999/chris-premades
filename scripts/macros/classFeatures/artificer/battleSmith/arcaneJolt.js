import {combatUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    let scale = workflow.actor.system?.scale?.['battle-smith']?.['arcane-jolt']?.formula;
    if (!scale) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ArcaneJolt.HarmOrHeal', [
        ['CHRISPREMADES.Macros.ArcaneJolt.Harm', 'harm'],
        ['CHRISPREMADES.Macros.ArcaneJolt.Heal', 'heal']
    ]);
    if (!selection?.length) return;
    if (selection === 'harm') {
        let damageRoll = await new CONFIG.Dice.DamageRoll(scale + '[force]', {}, {type: 'force'}).evaluate();
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'force', [targetToken], {flavor: workflow.item.name, itemCardId: workflow.chatCard.id});
    } else {
        let nearbyTargets = tokenUtils.findNearby(targetToken, 30, 'enemy');
        if (!nearbyTargets) return;
        let selected = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.ArcaneJolt.WhoHeal', nearbyTargets);
        if (!selected?.length) return;
        let target = selected[0];
        let damageRoll = await new CONFIG.Dice.DamageRoll(scale + '[healing]', {}, {type: 'healing'}).evaluate();
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'healing', [target], {flavor: workflow.item.name, itemCardId: workflow.chatCard.id});
    }
    await combatUtils.setTurnCheck(workflow.item, 'arcaneJolt');
}
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflow.item.system.properties.has('mgc')) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'arcaneJolt');
    if (!originItem) return;
    if (!combatUtils.perTurnCheck(originItem, 'arcaneJolt')) return;
    if (!originItem.system.uses.value) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(originItem, [workflow.targets.first()]);
}
export let arcaneJolt = {
    name: 'Arcane Jolt',
    version: '0.12.28',
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
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};