import {chris} from '../../helperFunctions.js';
export async function armorOfAgathys(workflow) {
    if (workflow.hitTargets.size != 1 || !workflow.item) return;
    let attackType = workflow.item.system.actionType;
    if (!(attackType === 'mwak' || attackType === 'msak')) return;
	let effect = chris.findEffect(workflow.hitTargets.first().actor, 'Armor of Agathys');
    if (!effect) return;
    let damage = effect.flags['midi-qol'].castData.castLevel * 5;
    let tempHP = workflow.hitTargets.first().actor.system.attributes.hp.temp;
    if (tempHP === 0) await chris.removeEffect(effect);
    await chris.applyDamage([workflow.token], damage, 'cold');
}