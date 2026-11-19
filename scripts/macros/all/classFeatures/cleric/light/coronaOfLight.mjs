import {automationUtils, constants, documentUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function disadvantage({document: effect, macroClass: {identifier, source}, sourceToken: token, workflow}) {
    if (!workflow.activity.hasSave || !workflow.activity.hasDamage) return;
    const origin = await fromUuid(effect.system.origin.effect);
    const activity = await fromUuid(origin?.system.origin.activity);
    if (!activity) return Logging(source, identifier, `Corona of Light exited early without locating its origin activity. (effect) ${effect.uuid}`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(coronaOfLight.config));
    const id = documentUtils.getIdentifier(workflow.item);
    const exception = config.identifiers?.length && config.identifiers.includes(id);
    if (workflow.item.type !== 'spell' && !exception) return;
    if (config.types?.length) {
        const types = workflow.damageRolls.length ?
            workflowUtils.getDamageTypes(workflow.damageRolls) :
            new Set(workflow.activity.getDamageConfig().rolls.map(r => r.options.type));
        if (!config.types.some(type => types.has(type)))
            return Logging.addMacroWarning(source, identifier, `Corona of Light exited early on invalid damage types. (effect) ${effect.uuid} (types) ${Array.from(types).join(', ')} (allowed) ${config.types.join(', ')}`);
    }
    workflowUtils.grantRollModifier(workflow, 'dis', token.id, identifier, activity.item.name);
}
export const coronaOfLight = {
    name: 'Corona of Light',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'targetPreambleComplete',
            macro: disadvantage,
            priority: 300,
            canOverlap: true
        }
    ],
    config: {
        identifiers: {
            default: ['radiance-of-the-dawn'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier'
        },
        types: {
            default: ['fire', 'radiant'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
