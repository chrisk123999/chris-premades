import {automationUtils, constants, documentUtils, DamageBonus} from '../../../../../proxy.mjs';
function bonus({document, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== automationUtils.getConfigValue(document, 'identifier')) return;
    if (!workflow.hitTargets.size) return;
    const ability = automationUtils.getConfigValue(document, 'ability');
    const mod = workflow.actor.system.abilities[ability]?.mod;
    if (!mod) return;
    return new DamageBonus(document, {formula: String(mod), optional: false, allowCritical: false, type: workflow.defaultDamageType});
}
export const agonizingBlast = {
    name: 'Eldritch Invocations: Agonizing Blast',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            phase: 'postResult',
            macro: bonus,
            priority: 250
        }
    ],
    config: {
        ability: {
            default: 'cha',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return constants.abilityOptions(); }
        },
        identifier: {
            default: 'eldritch-blast',
            type: 'text',
            label: 'CHRISPREMADES.Config.Identifiers',
            category: 'homebrew'
        }
    }
};
