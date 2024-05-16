import {chris} from '../../../helperFunctions.js';
export async function breakConcentration({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let conEffect = MidiQOL.getConcentrationEffect(targetActor);
    if (!conEffect) return;
    let conOriginUuid = conEffect.origin;
    if (!conOriginUuid) return;
    let effect = chris.getEffects(targetActor).find(eff => eff.flags['midi-qol']?.castData?.itemUuid === conOriginUuid);
    if (!effect) return;
    let castLevel = chris.getEffectCastLevel(effect);
    if (!castLevel) return;
    let damageFormula = castLevel + 'd4[psychic]';
    let damageRoll = await chris.damageRoll(workflow, damageFormula, undefined, true);
    await chris.removeEffect(conEffect);
    await workflow.setDamageRoll(damageRoll);
}