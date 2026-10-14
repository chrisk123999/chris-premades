import {actorUtils, automationUtils, documentUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document, workflow, ditem, targetToken}) {
    const identifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'negateDamageFromEffect', 'identifiers');
    if (!identifiers.length) return;
    if (!actorUtils.getEffects(targetToken.actor).some(effect => identifiers.includes(documentUtils.getIdentifier(effect)))) return;
    workflowUtils.negateDamageItemDamage(ditem);
}
/**
 * Negates the item's damage to targets that carry one of the listed effects.
 * Bound on an item. Fires on `itemDamageComplete`.
 *
 * Config:
 * - `identifiers`: identifiers of the effects that negate the damage.
 */
export const negateDamageFromEffect = {
    rules: 'all',
    version: '1.6.1',
    category: 'damage',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemDamageComplete',
            macro: damage,
            priority: 50
        }
    ],
    genericConfig: {
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: ''
        }
    }
};