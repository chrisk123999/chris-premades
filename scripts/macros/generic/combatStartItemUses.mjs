import {actorUtils, automationUtils, workflowUtils} from '../../proxy.mjs';
async function combatStart({document: activity, macroClass: {source, identifier}}) {
    const config = automationUtils.getGenericConfigValues(activity, source, identifier, Object.keys(combatStartItemUses.genericConfig));
    const feature = actorUtils.getItemByIdentifier(activity.actor, config.identifier);
    if (!feature || feature.system.uses.value >= config.minimum) return;
    if (config.fromZeroOnly && feature.system.uses.value > 0) return;
    const data = activity.toObject();
    data.consumption.targets = [{
        target: config.identifier,
        type: 'itemUses',
        value: '-' + (config.minimum - feature.system.uses.value)
    }];
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, []);
}
export const combatStartItemUses = {
    version: '2.0.4',
    rules: 'all',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    combat: [
        {
            pass: 'actorCombatStart',
            macro: combatStart,
            priority: 50
        }
    ],
    genericConfig: {
        identifier: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier'
        },
        minimum: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.CombatStartItemUses.Minimum'
        },
        fromZeroOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.CombatStartItemUses.FromZero'
        }
    }
};
