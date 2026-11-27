import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'thunder'];
async function swap({workflow}) {
    if (workflow.activity.identifier !== 'swap' || !workflow.actor.statuses.has('elementalAttunement')) return;
    const effect = workflow.item.effects.find(entry => documentUtils.getIdentifier(entry) === 'elementalEpitomeResistance');
    if (!effect) return;
    const type = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Macros.Modern.ElementalEpitome.Resistance', {userId: queryUtils.firstOwner(workflow.actor, true)});
    if (type) await documentUtils.update(effect, {'system.changes': [{key: 'system.traits.dr.value', type: 'add', value: type, priority: 20}]});
}
async function moved({document: effect, token}) {
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const activity = item ? itemUtils.getActivityByIdentifier(item, 'destructive-stride') : undefined;
    if (!activity || !token) return;
    const struck = effect.flags['chris-premades']?.destructiveStride ?? [];
    const targets = tokenUtils.findNearby(token, 5, {disposition: 'enemy'}).filter(other => other.actor && !struck.includes(other.uuid));
    if (!targets.length) return;
    await documentUtils.setFlag(effect, 'chris-premades', 'destructiveStride', [...struck, ...targets.map(other => other.uuid)]);
    await workflowUtils.completeActivityUse(activity, targets, {consumeResources: false});
}
export const elementalEpitome = {
    name: 'Elemental Epitome',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: swap,
            priority: 50
        }
    ]
};
export const elementalEpitomeStride = {
    name: 'Elemental Epitome: Destructive Stride',
    version: elementalEpitome.version,
    rules: '2024',
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};
