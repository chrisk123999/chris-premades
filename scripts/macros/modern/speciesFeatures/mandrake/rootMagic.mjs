import cprConstants from '../../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, itemUtils, Logging, queryUtils} from '../../../../proxy.mjs';
const abilities = ['int', 'wis', 'cha'];
async function syncAbility(item, ability) {
    const updates = {};
    item.system.activities.getByType('cast').filter(activity => activity.spell.ability !== ability).forEach(activity => {
        updates['system.activities.' + activity.id + '.spell.ability'] = ability;
    });
    if (Object.keys(updates).length) await documentUtils.update(item, updates);
}
async function addLimb(item) {
    if (actorUtils.getItemByIdentifier(item.actor, 'root-magic-limb')) return;
    const limbData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'root-magic-limb', {object: true, translate: 'CHRISPREMADES.Macros.Modern.RootMagic.Limb'});
    if (!limbData) return Logging.addMacroWarning('CPR', 'root-magic', 'Limb item not found in the automation items compendium.', {notify: 'warn'});
    await itemUtils.createItems(item.actor, [limbData], {parentEntity: item});
}
async function added({document: item}) {
    await addLimb(item);
    let ability = automationUtils.getConfigValue(item, 'ability');
    if (!ability) {
        const buttons = constants.abilityOptions.filter(option => abilities.includes(option.value)).map(option => [option.label, option.value, {image: option.image}]);
        ability = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.RootMagic.SelectAbility', buttons, {userId: queryUtils.firstOwner(item.actor, true)});
        if (!ability) return;
        await automationUtils.setConfigValue(item, 'ability', ability);
    }
    await syncAbility(item, ability);
}
async function updated({document: item}) {
    const ability = automationUtils.getConfigValue(item, 'ability');
    if (ability) await syncAbility(item, ability);
}
export const rootMagic = {
    name: 'Root Magic',
    version: '2.1.4',
    rules: '2024',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'munched',
            macro: added,
            priority: 50
        },
        {
            pass: 'updated',
            macro: updated,
            priority: 50
        }
    ],
    config: {
        ability: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            hint: 'CHRISPREMADES.Macros.Modern.RootMagic.AbilityHint',
            category: 'mechanics',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.RootMagic.Ask'}, ...constants.abilityOptions.filter(option => abilities.includes(option.value))]; }
        }
    }
};
