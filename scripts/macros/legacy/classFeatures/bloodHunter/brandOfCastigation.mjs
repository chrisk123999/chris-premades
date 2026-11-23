import {actorUtils, documentUtils, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function retaliate({document: effect, workflow}) {
    if (!workflow.token) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const brander = item?.actor;
    const branderToken = brander ? actorUtils.getFirstToken(brander) : undefined;
    if (!branderToken) return;
    const damaged = (workflow.damageList ?? []).filter(entry => (entry.totalDamage ?? entry.hpDamage ?? 0) > 0).map(entry => fromUuidSync(entry.tokenUuid ?? entry.targetUuid)).filter(Boolean);
    const triggers = damaged.some(token => token.actor === brander || (tokenUtils.isWithinDistance(branderToken, token, 5) && tokenUtils.canSee(branderToken, token)));
    if (!triggers) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'brand-damage');
    if (activity) await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
}
function axiomItem(effect) {
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    return item?.actor && actorUtils.getItemByIdentifier(item.actor, 'brand-of-axiom') ? item : undefined;
}
async function branded({document: effect}) {
    const item = axiomItem(effect);
    const actor = effect.parent;
    if (!item || !(actor instanceof Actor)) return;
    const hidden = actorUtils.getEffects(actor).filter(other => other.statuses.has('invisible'));
    await Promise.all(hidden.map(other => documentUtils.deleteDocument(other)));
    const token = actorUtils.getFirstToken(actor);
    const axiom = itemUtils.getActivityByIdentifier(item, 'axiom');
    if (!axiom || !token || !actor.isPolymorphed) return;
    const workflow = await workflowUtils.completeActivityUse(axiom, [token]);
    if (!workflow?.failedSaves?.size) return;
    const stunned = documentUtils.getEffectByIdentifier(actor, 'brandOfAxiom', {sourceActor: item.actor});
    const carried = [effect.toObject(), stunned?.toObject()].filter(Boolean);
    const reverted = await actor.revertOriginalForm({renderSheet: false});
    const original = reverted?.actor ?? reverted;
    if (original) await effectUtils.createEffects(original, carried);
}
async function strip({document: brand, effect}) {
    if (effect.statuses.has('invisible') && axiomItem(brand)) await documentUtils.deleteDocument(effect);
}
export const brandOfCastigationBranded = {
    name: 'Brand of Castigation: Branded',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageComplete',
            macro: retaliate,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'created',
            macro: branded,
            priority: 50
        },
        {
            pass: 'actorCreated',
            macro: strip,
            priority: 50
        }
    ]
};
