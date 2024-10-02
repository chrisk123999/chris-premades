import {combatUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

export async function arcaneJoltHelper(workflow, originItem) {
    let targetToken = workflow.hitTargets.first();
    let scale = originItem.actor.system?.scale?.['battle-smith']?.['arcane-jolt']?.formula;
    if (!scale) return;
    let selection = await dialogUtils.buttonDialog(originItem.name, 'CHRISPREMADES.Macros.ArcaneJolt.HarmOrHeal', [
        ['CHRISPREMADES.Macros.ArcaneJolt.Harm', 'harm'],
        ['CHRISPREMADES.Macros.ArcaneJolt.Heal', 'heal'],
        ['DND5E.None', false]
    ]);
    if (!selection?.length) return;
    if (selection === 'harm') {
        await workflowUtils.bonusDamage(workflow, scale + '[force]', {damageType: 'force'});
    } else {
        let nearbyTargets = tokenUtils.findNearby(targetToken, 30, 'enemy');
        if (!nearbyTargets) return;
        let selected = await dialogUtils.selectTargetDialog(originItem.name, 'CHRISPREMADES.Macros.ArcaneJolt.WhoHeal', nearbyTargets);
        if (!selected?.length) return;
        let target = selected[0];
        let damageRoll = await new CONFIG.Dice.DamageRoll(scale + '[healing]', {}, {type: 'healing'}).evaluate();
        await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'healing', [target], {flavor: originItem.name, itemCardId: workflow.chatCard.id, sourceItem: originItem});
    }
    await combatUtils.setTurnCheck(workflow.item, 'arcaneJolt');
    await workflowUtils.completeItemUse(originItem, {consumeUsage: true}, {configureDialog: false});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    if (!workflow.item.system.properties.has('mgc')) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'arcaneJolt');
    if (!originItem) return;
    if (!combatUtils.perTurnCheck(originItem, 'arcaneJolt')) return;
    if (!originItem.system.uses.value) return;
    await arcaneJoltHelper(workflow, originItem);
}
export let arcaneJolt = {
    name: 'Arcane Jolt',
    version: '0.12.83',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};