import {automationUtils, DamageBonus, documentUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function damage({document: item, workflow}) {
    if (!item.system.uses.value || !workflow.activity?.hasDamage || !workflow.targets.size) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'guided-precision');
    if (!activity) return Logging.addMacroWarning('CPR', 'guided-precision', 'Guided Precision activity not found.');
    const config = automationUtils.getConfigValues(item, configKeys);
    const listSpell = workflow.item.type === 'spell' && config.spells.includes(documentUtils.getIdentifier(workflow.item));
    const marked = workflow.activity.hasAttack
        ? workflow.hitTargets.filter(token => token.actor && config.targetEffects.some(identifier => documentUtils.getEffectByIdentifier(token.actor, identifier, {sourceActor: workflow.actor})))
        : new Set();
    if (!listSpell && !marked.size) return;
    const bonus = new DamageBonus(activity, {formula: config.formula, optional: !config.autoApply})
        .withDefaultCosts()
        .withOnUse(() => workflowUtils.completeActivityUse(activity, []));
    if (!listSpell) bonus.targets = marked.map(token => token.document);
    return bonus;
}
async function concentration({document: item, workflow}) {
    const actor = item.actor;
    const spells = automationUtils.getConfigValue(item, 'concentrationSpells');
    if (!Array.from(actor.concentration?.items ?? []).some(spell => spells.includes(documentUtils.getIdentifier(spell)))) return;
    if (Array.from(workflow.targets).some(token => token.actor && token.actor !== actor && token.actor.concentration?.effects.size)) return Logging.addMacroWarning('CPR', 'guided-precision', `Guided Precision did not skip the concentration check, another target is concentrating. (actor) ${actor.uuid}`);
    workflow.workflowOptions.noConcentrationCheck = true;
}
export const guidedPrecision = {
    name: 'Guided Precision',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        },
        {
            pass: 'targetDamageComplete',
            macro: concentration,
            priority: 50
        }
    ],
    config: {
        autoApply: {
            default: true,
            type: 'checkbox',
            category: 'mechanics',
            label: 'CHRISPREMADES.Config.AutoApply'
        },
        formula: {
            default: '@abilities.int.mod',
            type: 'text',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.DamageBonus'
        },
        spells: {
            default: ['faerie-fire', 'guiding-bolt', 'healing-word', 'locate-object', 'mind-spike', 'call-lightning', 'clairvoyance', 'banishment', 'locate-creature', 'scrying', 'teleportation-circle'],
            type: 'selectIdentifiers',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.SpellList'
        },
        targetEffects: {
            default: ['faerieFire'],
            type: 'selectIdentifiers',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.GuidedPrecision.TargetEffects'
        },
        concentrationSpells: {
            default: ['faerie-fire'],
            type: 'selectIdentifiers',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.GuidedPrecision.ConcentrationSpells'
        }
    }
};
const configKeys = Object.keys(guidedPrecision.config);
