import {chris} from '../../../helperFunctions.js';
export async function breakConcentration({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetActor = this.targets.first().actor;
    let conEffect = chris.findEffect(targetActor, 'Concentrating');
    if (!conEffect) return;
    let conOriginUuid = conEffect.flags['midi-qol']?.isConcentration;
    if (!conOriginUuid) return;
    let effect = targetActor.effects.find(eff => eff.flags['midi-qol']?.castData?.itemUuid === conOriginUuid);
    if (!effect) return;
    let castLevel = chris.getEffectCastLevel(effect);
    if (!castLevel) return;
    let damageFormula = castLevel + 'd4[psychic]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await chris.removeEffect(effect);
    await chris.removeEffect(conEffect);
    await this.setDamageRoll(damageRoll);
}