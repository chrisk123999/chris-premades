import {actorUtils, automationUtils, constants, dialogUtils, queryUtils} from '../../../../../proxy.mjs';
import {getCurrentEntry, getEffigy, getEntries, setEffigyAura} from './bewitchedEffigy.mjs';
const translations = 'CHRISPREMADES.Macros.Modern.WickerZenith.';
async function aura({document: item, data: {itemData}}) {
    const identifier = itemData.system?.identifier;
    if (identifier === 'bewitched-effigy-soothe') return {aura: {turnStartActivity: 'wicker-zenith-soothe'}};
    if (identifier !== 'bewitched-effigy-ward') return;
    let ability = automationUtils.getConfigValue(item, 'ability');
    if (!ability) {
        const buttons = constants.abilityOptions.map(option => [option.label, option.value, {image: option.image}]);
        ability = await dialogUtils.buttonDialog(item.name, translations + 'SelectAbility', buttons, {userId: queryUtils.firstOwner(item.actor, true)});
    }
    if (!ability) return;
    return {changes: [{key: 'flags.midi-qol.advantage.ability.save.' + ability, type: 'override', value: '1', priority: 20}]};
}
async function turnStart({document: item, actor}) {
    const effigyItem = actorUtils.getItemByIdentifier(actor, 'bewitched-effigy');
    const summon = effigyItem ? getEffigy(effigyItem) : undefined;
    if (!summon) return;
    const current = await getCurrentEntry(effigyItem, summon);
    const summonActivityId = automationUtils.getGenericConfigValue(effigyItem, 'cat', 'summon', 'activityId');
    const summonActivity = effigyItem.system.activities.get(summonActivityId) ?? effigyItem.system.activities.getByType('summon')[0];
    const entries = getEntries(effigyItem).filter(entry => entry.profile !== current?.profile);
    if (!entries.length) return;
    const buttons = entries.map(entry => [summonActivity?.profiles.find(profile => profile._id === entry.profile)?.name || entry.profile, entry.profile]);
    buttons.push([_loc(translations + 'Keep'), 'keep']);
    const choice = await dialogUtils.buttonDialog(item.name, translations + 'ChangeAura', buttons, {userId: queryUtils.firstOwner(actor, true)});
    const entry = entries.find(entry => entry.profile === choice);
    if (entry) await setEffigyAura(effigyItem, summon, entry);
}
export const wickerZenith = {
    name: 'Wicker Zenith',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorBewitchedEffigyAura',
            macro: aura,
            priority: 60
        }
    ],
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: {
        ability: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Ability',
            hint: 'CHRISPREMADES.Macros.Modern.WickerZenith.AbilityHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.WickerZenith.Ask'}, ...constants.abilityOptions]; }
        }
    }
};
