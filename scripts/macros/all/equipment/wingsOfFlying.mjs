import {documentUtils, effectUtils, itemUtils, rollUtils} from '../../../proxy.mjs';
async function landed({document: effect}) {
    const actor = effectUtils.getActor(effect);
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!actor || !item) return;
    const {roll} = await rollUtils.rollDice('1d12', {document: actor, message: true, flavor: item.name});
    await effectUtils.createEffects(actor, [{
        name: item.name + ': ' + _loc('CHRISPREMADES.Macros.All.WingsOfFlying.Recharging'),
        img: item.img,
        origin: item.uuid,
        duration: {value: roll.total * 3600, units: 'seconds'},
        flags: {cat: {identifier: 'wingsOfFlyingRecharge', wingsOfFlying: item.uuid, macros: {effect: [{source: 'chris-premades', rules: 'all', identifier: 'wings-of-flying-recharge'}]}}}
    }]);
}
async function recharged({document: effect}) {
    const item = await fromUuid(effect.flags.cat?.wingsOfFlying);
    const activity = item && itemUtils.getActivityByIdentifier(item, 'fly');
    if (activity?.uses.spent) await documentUtils.update(activity, {'uses.spent': 0});
}
export const wingsOfFlying = {
    name: 'Wings of Flying',
    version: '2.1.7',
    rules: 'all',
    effect: [
        {
            pass: 'deleted',
            macro: landed,
            priority: 50
        }
    ]
};
export const wingsOfFlyingRecharge = {
    name: 'Wings of Flying: Recharging',
    version: wingsOfFlying.version,
    rules: wingsOfFlying.rules,
    effect: [
        {
            pass: 'deleted',
            macro: recharged,
            priority: 50
        }
    ]
};
