import {automationUtils, constants, documentUtils} from '../../../../../proxy.mjs';
async function transformed({document: item, data}) {
    const creatureTypes = automationUtils.getConfigValue(item, 'creatureTypes') ?? primalStrike.config.creatureTypes.default;
    if (!creatureTypes.includes((data.form ?? data.newActor).system.details?.type?.value)) return;
    const updates = data.newActor.items.filter(entry => {
        if (entry.system.properties?.has('mgc')) return false;
        if (entry.type === 'weapon') return true;
        return entry.system.activities?.some(activity => activity.type === 'attack' && activity.damage?.parts?.length);
    }).map(entry => ({_id: entry.id, 'system.properties': [...entry.system.properties, 'mgc']}));
    if (updates.length) await documentUtils.updateEmbeddedDocuments(data.newActor, 'Item', updates);
}
export const primalStrike = {
    name: 'Primal Strike',
    version: '2.1.11',
    rules: '2014',
    called: [
        {
            pass: 'actorWildShape',
            macro: transformed,
            priority: 50
        }
    ],
    config: {
        creatureTypes: {
            default: ['beast'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            category: 'homebrew',
            get options() { return constants.creatureTypeOptions; }
        }
    }
};
