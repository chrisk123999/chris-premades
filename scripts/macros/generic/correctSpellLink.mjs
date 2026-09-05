import {activityUtils, automationUtils, compendiumUtils} from '../../proxy.mjs';
async function linkSpell({document: item}) {
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'correctSpellLink', Object.keys(correctSpellLink.genericConfig));
    const activity = item.system.activities.get(config.activity);
    if (!config.identifier || !activity) return;
    const spell = await compendiumUtils.getSpell(config.identifier, {packIds: config.packIds});
    if (spell) await activityUtils.correctSpellLink(activity, spell); 
}
export const correctSpellLink = {
    version: '2.0.3',
    rules: 'all',
    generic: true,
    documents: ['item'],
    item: [
        {
            pass: 'created',
            macro: linkSpell,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: linkSpell,
            priority: 50
        },
        {
            pass: 'munched',
            macro: linkSpell,
            priority: 50
        }
    ],
    genericConfig: {
        activity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity'
        },
        identifier: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.SpellIdentifier',
            category: 'behavior'
        },
        packIds: {
            default: [],
            type: 'packOrFolderMultiSelect',
            mode: 'pack',
            label: 'CHRISPREMADES.Config.SpellCompendiums',
            hint: 'CHRISPREMADES.Macros.Generic.Common.PacksHint',
            category: 'behavior'
        }
    }
};
