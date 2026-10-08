import {actorUtils, automationUtils, constants, workflowUtils} from '../../../../../proxy.mjs';
function getConfig(document, key) {
    return automationUtils.getOriginConfigValue(document, key) ?? holyNimbus.config[key].default;
}
async function save({config, document}) {
    const source = workflowUtils.getSaveSource(config);
    if (source?.item?.type !== 'spell') return;
    if (!getConfig(document, 'creatureTypes').includes(actorUtils.typeOrRace(source.actor))) return;
    return {label: 'CHRISPREMADES.Macros.Legacy.HolyNimbus.Save', type: 'advantage'};
}
export const holyNimbus = {
    name: 'Holy Nimbus',
    version: '2.0.0',
    rules: '2014',
    save: [
        {
            pass: 'actorContext',
            macro: save,
            priority: 50
        }
    ],
    config: {
        creatureTypes: {
            default: ['fiend', 'undead'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
