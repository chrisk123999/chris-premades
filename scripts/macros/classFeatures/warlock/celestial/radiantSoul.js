import {combatUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function damage({trigger: {entity: item}, workflow})  {
    if (workflow.item.type !== 'spell' || workflow.hitTargets.size !== 1) return;
    let damageTypes= workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('fire') && !damageTypes.has('radiant')) return;
    let buttons = [];
    if (damageTypes.has('fire')) buttons.push([genericUtils.format('CHRISPREMADES.Dialog.YesDetail', {detail: genericUtils.translate('DND5E.DamageFire')}), 'fire']);
    if (damageTypes.has('radiant')) buttons.push([genericUtils.format('CHRISPREMADES.Dialog.YesDetail', {detail: genericUtils.translate('DND5E.DamageRadiant')}), 'radiant']);
    buttons.push(['CHRISPREMADES.Generic.No', false]);
    let selected = await dialogUtils.buttonDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), buttons);
    if (!selected?.length) return;
    await combatUtils.setTurnCheck(item, 'radiantSoul');
    let bonusFormula = workflow.actor.system.abilities.cha.mod + '[' + selected + ']';
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: selected});
}
async function applyDamage({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell' || workflow.hitTargets.size < 2) return;
    if (!combatUtils.perTurnCheck(item, 'radiantSoul')) return;
    let damageTypes= workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('fire') && !damageTypes.has('radiant')) return;
    await combatUtils.setTurnCheck(item, 'radiantSoul');
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), Array.from(workflow.hitTargets));
    if (!selection?.length) return;
    let target = selection[0];
    let buttons = [];
    if (damageTypes.has('fire')) buttons.push([genericUtils.format('CHRISPREMADES.Dialog.YesDetail', {detail: genericUtils.translate('DND5E.DamageFire')}), 'fire']);
    if (damageTypes.has('radiant')) buttons.push([genericUtils.format('CHRISPREMADES.Dialog.YesDetail', {detail: genericUtils.translate('DND5E.DamageRadiant')}), 'radiant']);
    let selected;
    if (buttons.length === 2) {
        selected = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
        if (!selected) selected = 'radiant';
    } else if (damageTypes.has('fire')) {
        selected = 'fire';
    } else {
        selected = 'radiant';
    }
    let damageRaw = workflow.actor.system.abilities.cha.mod;
    let ditem = workflow.damageList.find(i => i.actorId === target.actor.id);
    if (!ditem) return;
    let dInd = ditem.rawDamageDetail.findIndex(i => i.type === selected);
    ditem.rawDamageDetail[dInd].value += damageRaw;
    let modDamage = damageRaw * (ditem.damageDetail[dInd].active.multiplier ?? 1);
    ditem.damageDetail[dInd].value += modDamage;
    ditem.hpDamage += modDamage;
}
async function late({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.hitTargets.size) return;
    await combatUtils.setTurnCheck(item, 'radiantSoul', true);
}
export let radiantSoul = {
    name: 'Radiant Soul',
    version: '0.12.54',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    ddbi: {
        restrictedItems: {
            'Radiant Soul': {
                originalName: 'Radiant Soul',
                requiredClass: 'Warlock',
                requiredSubclass: 'The Celestial',
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Radiant Soul',
                removedItems: [],
                additionalItems: [],
                priority: 0
            }
        }
    }
};