import {actorUtils, automationUtils} from '../../proxy.mjs';
import {syncEnvironment} from './environment.mjs';
function getMode(document) {
    if (!document.flags.cat?.genericConfig?.['chris-premades']?.breathing) return;
    return automationUtils.getGenericConfigValue(document, 'chris-premades', 'breathing', 'mode', {rules: 'all'});
}
export function getBreathing(actor) {
    const modes = new Set([...actor.items, ...actorUtils.getEffects(actor).filter(effect => effect.active)].map(getMode));
    if (modes.has('none')) return 'none';
    if (modes.has('water')) return 'water';
}
async function sync({document}) {
    const actor = document.documentName === 'ActiveEffect' ? document.target : document.actor;
    if (!(actor instanceof Actor)) return;
    for (const token of actorUtils.getTokens(actor)) await syncEnvironment(token);
}
/**
 * Marks an item or effect that lets its creature breathe water, or not need to breathe at all.
 * Environment areas skip Holding Breath for it.
 * Bound on an item or effect. Fires on `created` and `deleted`.
 *
 * Config:
 * - `mode`: `water` or `none`.
 */
export const breathing = {
    rules: 'all',
    version: '2.1.8',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect', 'item'],
    effect: [
        {
            pass: 'created',
            macro: sync,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: sync,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: sync,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: sync,
            priority: 50
        }
    ],
    genericConfig: {
        mode: {
            default: 'water',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Generic.Breathing.Mode',
            hint: 'CHRISPREMADES.Macros.Generic.Breathing.ModeHint',
            options: [
                {value: 'water', label: 'CHRISPREMADES.Macros.Generic.Breathing.Water'},
                {value: 'none', label: 'CHRISPREMADES.Macros.Generic.Breathing.None'}
            ]
        }
    }
};
