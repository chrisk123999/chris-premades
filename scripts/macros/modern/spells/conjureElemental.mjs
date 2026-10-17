import {actorUtils, documentUtils, effectUtils, summonUtils} from '../../../proxy.mjs';
const restrainedIdentifier = 'conjure-elemental-restrained';
function getRestrained(sourceActor) {
    return effectUtils.getSceneEffects(actorUtils.getFirstToken(sourceActor)?.parent ?? canvas.scene, restrainedIdentifier, {origin: sourceActor});
}
function free({source}) {
    return !getRestrained(source).length;
}
async function element({workflow}) {
    const effects = getRestrained(workflow.actor);
    if (workflow.activity.identifier === 'initial') {
        await summonUtils.makeDependentOnParent(workflow.actor, effects);
        return;
    }
    if (workflow.activity.identifier !== 'restrained') return;
    const saved = new Set(Array.from(workflow.saves, token => token.actor));
    await Promise.all(effects.filter(effect => saved.has(effect.parent)).map(effect => documentUtils.deleteDocument(effect)));
}
export const conjureElementalElement = {
    name: 'Conjure Elemental: Element',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: element, priority: 50}
    ]
};
export const conjureElementalFree = {
    name: 'Conjure Elemental: No Creature Restrained',
    version: conjureElementalElement.version,
    rules: conjureElementalElement.rules,
    aura: [
        {pass: 'filter', macro: free, priority: 50}
    ]
};
