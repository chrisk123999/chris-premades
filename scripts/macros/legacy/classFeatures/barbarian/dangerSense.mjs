import {automationUtils, constants} from '../../../../proxy.mjs';
async function save({actor, config, document: item, options, saveId}) {
    if (config.advantage || options.advantage) return;
    const saves = automationUtils.getConfigValue(item, 'saves');
    if (!saves.includes(saveId)) return;
    const statuses = automationUtils.getConfigValue(item, 'conditions');
    if (actor.statuses.some(s => statuses.includes(s))) return;
    return {label: 'CHRISPREMADES.Macros.Legacy.DangerSense', type: 'advantage'};
}
export const dangerSense = {
    name: 'Danger Sense',
    version: '2.0.2',
    rules: '2014',
    save: [
        {
            pass: 'actorContext',
            macro: save,
            priority: 250
        }
    ],
    config: {
        saves: {
            default: ['dex'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.SaveAbilities',
            category: 'behavior',
            get options() { return constants.abilityOptions; }
        },
        conditions: {
            default: ['blinded', 'deafened', 'incapacitated'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            category: 'behavior',
            get options() { return constants.statusOptions; }
        }
    }
};
