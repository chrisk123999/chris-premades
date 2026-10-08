import {automationUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function banish({document, actor, workflow}) {
    if (workflow.activity.identifier !== 'banishing-smite-rider') return;
    const activity = itemUtils.getActivityByIdentifier(document, 'banish');
    if (!activity) return;
    const maxHp = automationUtils.getConfigValue(document, 'hp');
    const targets = Array.from(workflow.targets, token => token.document ?? token).filter(token => token.actor && token.actor.system.attributes.hp.value <= maxHp);
    const endSpell = async () => {
        const concentration = effectUtils.getConcentrationEffect(actor, document);
        if (concentration) await documentUtils.deleteDocument(concentration);
    };
    if (!targets.length) return await endSpell();
    await workflowUtils.syntheticActivityRoll(activity, targets, {consumeUsage: false, consumeResources: false, spellSlot: false, config: {concentration: {begin: false}}});
    const banished = targets.filter(token => documentUtils.getEffectByIdentifier(token.actor, 'banished', {sourceActor: actor}));
    if (!banished.length) return await endSpell();
    const concentration = effectUtils.getConcentrationEffect(actor, document);
    if (!concentration) return;
    const created = banished.flatMap(token => documentUtils.getEffectByIdentifier(token.actor, 'banished', {multiple: true, sourceActor: actor}) ?? []).filter(effect => effect.flags.dnd5e?.dependentOn !== concentration.uuid);
    await documentUtils.makeDependent(concentration, created);
}
export const banishingSmite = {
    name: 'Banishing Smite',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: banish,
            priority: 50
        }
    ],
    config: {
        hp: {
            default: 50,
            type: 'number',
            label: 'CHRISPREMADES.Config.HitPoints',
            category: 'homebrew'
        }
    }
};
