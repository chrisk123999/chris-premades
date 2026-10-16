import {actorUtils, effectUtils} from '../../proxy.mjs';
async function inherit({document: activity, config, dialog}) {
    const concentration = effectUtils.getConcentrationEffect(activity.actor, activity.item);
    if (!concentration) return;
    const level = Math.min(activity.item.system.level + (concentration.flags.dnd5e?.scaling ?? 0) + (Number(concentration.flags.cat?.castLevelBonus) || 0), 9);
    config.spell = {...config.spell, slot: actorUtils.getEquivalentSpellSlotName(activity.actor, level) ?? 'spell' + level};
    dialog.configure = false;
}
/**
 * Uses a follow-up activity at the level the concentration spell was cast at, without the configuration dialog.
 * A number in the concentration effect's `flags.cat.castLevelBonus` raises that level.
 * Bound on an activity. Fires on `activityPreTargeting`.
 */
export const inheritCastLevel = {
    rules: 'all',
    version: '2.1.3',
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
