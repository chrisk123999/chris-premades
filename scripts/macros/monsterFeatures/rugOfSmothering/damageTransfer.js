import {chris} from '../../../helperFunctions.js';

export async function damageTransfer({speaker, actor, token, character, item, args, scope, workflow}) {
    const sourceToken = args[0].options.token;
    const targetHasEffect = MidiQOL.findNearby(null,sourceToken,5,{})?.find(t=>chris.findEffect(t.actor, 'Smother')?.origin === actor.items.getName('Smother')?.uuid);
    if (!targetHasEffect) return;
    const damage = Math.floor(workflow.damageItem.hpDamage/2);
    const splitDamage = workflow.damageItem.hpDamage - damage;
    workflow.damageItem.hpDamage = splitDamage;
    await MidiQOL.applyTokenDamage([{damage,type:workflow.defaultDamageType}],damage,new Set([targetHasEffect]),null,new Set(),{});
}