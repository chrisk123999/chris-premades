import {actorUtils, dialogUtils, documentUtils, itemUtils, rollUtils} from '../../proxy.mjs';
function attackBonus(actor) {
    const bonuses = actorUtils.getEquippedWeapons(actor).flatMap(weapon => weapon.system.activities.getByType('attack')).map(activity => Number(activity.labels.toHit)).filter(Number.isFinite);
    if (bonuses.length) return Math.max(...bonuses);
    return actor.system.attributes.prof + Math.max(actor.system.abilities.str.mod, actor.system.abilities.dex.mod);
}
async function opposedRoll(actor, bonus, label) {
    const {roll} = await rollUtils.rollDice('1d20 + ' + bonus, {document: actor, message: true, flavor: label, speaker: ChatMessage.implementation.getSpeaker({actor}), manual: true});
    return roll;
}
async function hit({workflow, hit}) {
    const target = hit[0];
    const weapons = target ? actorUtils.getEquippedWeapons(target.actor) : [];
    if (!weapons.length) return;
    const label = itemUtils.getMasteryLabel('disarming');
    if (!await actorUtils.confirmBonusAction(workflow.actor, label, _loc('CHRISPREMADES.WeaponMasteries.Disarming.Prompt', {target: target.name}))) return;
    const ownRoll = await opposedRoll(workflow.actor, Number(workflow.activity.labels.toHit) || 0, label);
    const targetRoll = await opposedRoll(target.actor, attackBonus(target.actor), label);
    if (ownRoll.total <= targetRoll.total) return;
    const weapon = weapons.length > 1 ? (await dialogUtils.selectDocumentDialog(label, _loc('CHRISPREMADES.WeaponMasteries.Disarming.Which'), weapons)) : weapons[0];
    if (!weapon) return;
    if (ownRoll.dice[0].total === 20 && await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Disarming.Catch', {weapon: weapon.name}))) {
        const data = weapon.toObject();
        data.system.equipped = true;
        await itemUtils.createItems(workflow.actor, [data]);
        await documentUtils.deleteDocument(weapon);
        return;
    }
    await documentUtils.update(weapon, {'system.equipped': false});
}
export const disarmingMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Disarming.Label',
    macro: hit
};
