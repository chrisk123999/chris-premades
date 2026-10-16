import {documentUtils, effectUtils, Logging, summonUtils} from '../../../proxy.mjs';
const hauntedIdentifier = 'spirit-of-death-haunted';
function hauntedEffects(sourceActor) {
    return effectUtils.getSceneEffects(canvas.scene, hauntedIdentifier, {origin: sourceActor});
}
function isHaunted(sourceActor, targetActor) {
    return !!targetActor?.effects.some(effect => documentUtils.getIdentifier(effect) === hauntedIdentifier && effect.origin?.startsWith(sourceActor.uuid));
}
async function haunt({workflow}) {
    if (workflow.activity.identifier !== 'haunt') return;
    const targets = new Set(Array.from(workflow.targets, token => token.actor));
    const effects = hauntedEffects(workflow.actor);
    await Promise.all(effects.filter(effect => !targets.has(effect.parent)).map(effect => documentUtils.deleteDocument(effect)));
    await summonUtils.makeDependentOnParent(workflow.actor, effects.filter(effect => targets.has(effect.parent)));
}
function hauntedFilter({source, target}) {
    return isHaunted(source, target);
}
function scytheTarget({workflow}) {
    if (isHaunted(workflow.actor, workflow.targets.first()?.actor)) return;
    Logging.addMacroWarning('CPR', 'spirit-of-death-scythe', 'CHRISPREMADES.Macros.Legacy.SpiritOfDeath.InvalidTarget', {notify: 'info'});
    return true;
}
function scytheAdvantage({document, workflow}) {
    workflow.tracker.advantage.add('spirit-of-death-scythe', document.name);
}
export const spiritOfDeathHaunt = {
    name: 'Haunt Creature',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: haunt, priority: 50}
    ]
};
export const spiritOfDeathHaunted = {
    name: 'Haunted',
    version: spiritOfDeathHaunt.version,
    rules: spiritOfDeathHaunt.rules,
    aura: [
        {pass: 'filter', macro: hauntedFilter, priority: 50}
    ]
};
export const spiritOfDeathScythe = {
    name: 'Reaping Scythe',
    version: spiritOfDeathHaunt.version,
    rules: spiritOfDeathHaunt.rules,
    roll: [
        {pass: 'itemPreItemRoll', macro: scytheTarget, priority: 50},
        {pass: 'itemAttackRollConfig', macro: scytheAdvantage, priority: 50}
    ]
};
