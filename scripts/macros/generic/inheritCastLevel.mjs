import {effectUtils} from '../../proxy.mjs';
async function inherit({document: activity, config, dialog}) {
    const concentration = effectUtils.getConcentrationEffect(activity.actor, activity.item);
    if (!concentration) return;
    const level = activity.item.system.level + (concentration.flags.dnd5e?.scaling ?? 0);
    config.spell = {...config.spell, slot: 'spell' + level};
    dialog.configure = false;
}
/**
 * Uses a follow-up activity at the level the concentration spell was cast at, without the configuration dialog.
 * Bound on an activity. Fires on `activityPreTargeting`.
 */
export const inheritCastLevel = {
    rules: 'all',
    version: '2.0.0',
    category: 'mechanics',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: inherit,
            priority: 50
        }
    ]
};
