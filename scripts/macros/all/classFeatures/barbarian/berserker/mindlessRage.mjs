import {automationUtils, constants} from '../../../../../proxy.mjs';
async function mindless({data, document: item}) {
    const statuses = automationUtils.getConfigValue(item, 'status');
    for (const s of statuses) data.effectData.system.changes.push({
        key: 'system.traits.ci.value', type: 'add', value: s
    });
    return data.effectData;
}
export const mindlessRage = {
    name: 'Mindless Rage',
    version: '2.1.4',
    rules: 'all',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: mindless,
            priority: 200
        }
    ],
    config: {
        status: {
            default: ['charmed', 'frightened'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.IgnoredConditions',
            get options() { return constants.statusOptions; }
        }
    }
};
