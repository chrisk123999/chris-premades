import {automationUtils, compendiumUtils, itemUtils} from '../../../../../proxy.mjs';
import {abilityConfig, prepareAbility} from './starryForm.mjs';
async function created({document: item}) {
    const actor = item.actor;
    if (!actor) return;
    const identifiers = String(automationUtils.getConfigValue(item, 'spells') ?? starMap.config.spells.default).split(',').map(identifier => identifier.trim()).filter(Boolean);
    const missing = identifiers.filter(identifier => !actor.items.some(entry => entry.system.identifier === identifier && !entry.getFlag('dnd5e', 'cachedFor')));
    const spells = [];
    for (const identifier of missing) {
        const spellData = await compendiumUtils.getSpell(identifier, {object: true, rules: item.system.source?.rules});
        if (!spellData) continue;
        spellData.system.method = 'spell';
        spellData.system.prepared = 2;
        spellData.system.sourceItem = 'class:' + (automationUtils.getConfigValue(item, 'classIdentifier') ?? starMap.config.classIdentifier.default);
        spells.push(spellData);
    }
    if (!spells.length) return;
    await itemUtils.createItems(actor, spells);
}
export const starMap = {
    name: 'Star Map',
    version: '2.1.11',
    rules: 'all',
    item: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: prepareAbility,
            priority: 50
        }
    ],
    config: {
        ability: abilityConfig,
        spells: {
            default: 'guidance, guiding-bolt',
            type: 'text',
            label: 'CHRISPREMADES.Config.Identifiers',
            category: 'homebrew'
        },
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
