import {chris} from '../../../../helperFunctions.js';
export async function brandOfCastigation({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let effect = chris.findEffect(workflow.actor, 'Brand of Castigation');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let damage = chris.getSpellMod(originItem);
    if (originItem.actor.classes['blood-hunter'].system.levels >= 13) damage = damage * 2;
    let applySelfDamage = false;
    let targetToken = workflow.hitTargets.first();
    if (!targetToken) return;
    if (targetToken.actor.id === originItem.actor.id) {
        applySelfDamage = true;
    } else {
        let nearbyTargets = chris.findNearby(targetToken, 5, null)
        for (let i = 0; nearbyTargets.length > i; i++) {
            if (nearbyTargets[i].actor.id === originItem.actor.id) {
                applySelfDamage = true;
                break;
            }
        }
    }
    if (!applySelfDamage) return;
    await chris.applyDamage(workflow.token, damage, 'psychic')
}