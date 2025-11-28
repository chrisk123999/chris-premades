import {dialogUtils, genericUtils, rollUtils} from '../../../utils.js';
async function attack(workflow) {
    if (!workflow.attackRoll || !workflow.actor.system.attributes.inspiration) return;
    let selection = await dialogUtils.selectDie([workflow.attackRoll], 'CHRISPREMADES.HeroicInspiration.Name', genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')}), {buttons: 'yesNo'});
    if (!selection) return;
    let positions = selection[0].split('-').map(i => Number(i));
    let roll = await rollUtils.rollDice('1d' + workflow.attackRoll.terms[positions[1]].faces, {chatMessage: true, flavor: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')});
    let newRoll = rollUtils.updateDieResult(workflow.attackRoll, positions[1], positions[2], roll.roll.total);
    await workflow.setAttackRoll(newRoll);
    await genericUtils.update(workflow.actor, {'system.attributes.inspiration': false});
}
async function damage(workflow) {
    if (!workflow.damageRolls || !workflow.actor.system.attributes.inspiration) return;
    let selection = await dialogUtils.selectDie(workflow.damageRolls, 'CHRISPREMADES.HeroicInspiration.Name', genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')}), {buttons: 'yesNo'});
    if (!selection) return;
    let positions = selection[0].split('-').map(i => Number(i));
    let roll = await rollUtils.rollDice('1d' + workflow.damageRolls[positions[0]].terms[positions[1]].faces, {chatMessage: true, flavor: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')});
    let newRoll = rollUtils.updateDieResult(workflow.damageRolls[positions[0]], positions[1], positions[2], roll.roll.total);
    workflow.damageRolls[[positions[0]]] = newRoll;
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.update(workflow.actor, {'system.attributes.inspiration': false});
}
async function saveSkillCheck(roll, actor) {
    if (!actor.system.attributes.inspiration) return;
    let selection = await dialogUtils.selectDie([roll], 'CHRISPREMADES.HeroicInspiration.Name', genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')}), {buttons: 'yesNo'});
    if (!selection) return;
    let positions = selection[0].split('-').map(i => Number(i));
    let rolled = await rollUtils.rollDice('1d' + roll.terms[positions[1]].faces, {chatMessage: true, flavor: genericUtils.translate('CHRISPREMADES.HeroicInspiration.Name')});
    let newRoll = rollUtils.updateDieResult(roll, positions[1], positions[2], rolled.roll.total);
    await genericUtils.update(actor, {'system.attributes.inspiration': false});
    return newRoll;
}
export let heroicInspiration = {
    attack,
    damage,
    saveSkillCheck
};