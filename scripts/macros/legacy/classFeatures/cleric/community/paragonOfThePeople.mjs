import {automationUtils, constants, genericUtils, Logging} from '../../../../../proxy.mjs';
async function preFeast({document: item, data}) {
    const extra = automationUtils.getConfigValue(item, 'conditions');
    if (!extra?.length) return;
    for (const id of Object.keys(data.itemData.system.activities)) {
        const activity = data.itemData.system.activities[id];
        if (activity?.type !== 'heal') continue;
        const conditions = genericUtils.getProperty(activity, 'flags.cat.genericConfig.chris-premades.choiceRemoveCondition.conditions');
        if (conditions) conditions.push(...extra);
    }
}
async function preWatch({document: item, data, macroClass: {identifier, source}}) {
    const config = automationUtils.getConfigValues(item, ['formula', 'immune']);
    if (config.immune.length) data.effectData.system.changes.push(
        ...config.immune.map(i => ({key: 'system.traits.ci.value', type: 'add', value: i}))
    );
    if (!config.formula) return;
    const key = `flags.${source}.communityWatchBonus`;
    const formula = data.effectData.system.changes.find(c => c.key === key);
    if (formula) formula.value = config.formula;
    else Logging.addMacroWarning(source, identifier, `Paragon of the People could not find the Community Watch effect change for its dice formula. (item) ${item.uuid} (community watch) ${data.workflow.activity.uuid} (change key) ${key}`);
}
export const paragonOfThePeople = {
    name: 'Paragon of the People',
    version: '2.1.11',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateMagnificentFeast',
            macro: preFeast,
            priority: 200
        },
        {
            pass: 'actorPreCreateCommunityWatchEffect',
            macro: preWatch,
            priority: 200
        }
    ],
    config: {
        conditions: {
            default: ['cursed', 'diseased'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            get options() { return constants.statusOptions; }
        },
        formula: {
            default: '2d6',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        },
        immune: {
            default: ['frightened'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.IntimidatingPresence.Immune',
            get options() { return constants.statusOptions; }
        }
    }
};
