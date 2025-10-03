import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function interceptionHelper(token, targetToken, ditem) {
    let actor = token.actor;
    if (actorUtils.hasUsedReaction(actor)) return;
    let interception = itemUtils.getItemByIdentifier(actor, 'interception');
    if (!interception) return;
    let items = actor.items.filter(i => i.system.equipped && ((i.type === 'weapon' && !constants.unarmedAttacks.includes(genericUtils.getIdentifier(i)) || i.system.type?.value === 'shield')));
    if (!items.length) return;
    let selection = await dialogUtils.confirm(interception.name, genericUtils.format('CHRISPREMADES.Macros.SpiritShield.Damage', {item: interception.name, name: targetToken.document.name}), {userId: socketUtils.firstOwner(actor, true)});
    if (!selection) return;
    let result = await workflowUtils.syntheticItemRoll(interception, [token], {consumeResources: true, userId: socketUtils.firstOwner(actor, true)});
    workflowUtils.modifyDamageAppliedFlat(ditem, -result.damageRolls[0].total);
    return true;
}
async function damageApplication({trigger: {targetToken}, workflow, ditem}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let nearbyTokens = tokenUtils.findNearby(targetToken, 5, 'ally', {includeIncapacitated: false, includeToken: false});
    for (let i of nearbyTokens) {
        let intercepted = await interceptionHelper(i, targetToken, ditem);
        if (intercepted) break;
    }
}
export let interception = {
    name: 'Interception',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};
