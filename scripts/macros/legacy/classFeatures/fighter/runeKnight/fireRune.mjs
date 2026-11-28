import {documentUtils} from '../../../../../proxy.mjs';
async function sync({document: item}) {
    const actor = item.actor;
    if (!actor) return;
    const changes = Object.entries(actor._source.system.tools ?? {}).filter(([, tool]) => tool.value >= 1).map(([key]) => ({key: 'system.tools.' + key + '.value', type: 'upgrade', value: '2', priority: 20}));
    const existing = item.effects.find(effect => documentUtils.getIdentifier(effect) === 'fireRuneTools');
    if (existing) {
        if (!foundry.utils.equals(existing.system.changes.map(({key}) => key), changes.map(({key}) => key))) await documentUtils.update(existing, {'system.changes': changes});
        return;
    }
    if (!changes.length) return;
    const effectData = documentUtils.getBaseEffectData(item, {name: item.name, img: item.img, origin: item.uuid, identifier: 'fireRuneTools', changes});
    effectData.transfer = true;
    await documentUtils.createEmbeddedDocuments(item, 'ActiveEffect', [effectData]);
}
const passes = ['created', 'medkit', 'munched'].map(pass => ({pass, macro: sync, priority: 50}));
export const fireRune = {
    name: 'Fire Rune',
    version: '2.1.11',
    rules: '2014',
    item: passes,
    called: [
        {
            pass: 'actorToolsUpdated',
            macro: sync,
            priority: 50
        }
    ]
};
