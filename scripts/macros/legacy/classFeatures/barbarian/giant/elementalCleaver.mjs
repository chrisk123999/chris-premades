import {applications, automationUtils, constants, dataUtils, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, uiUtils} from '../../../../../proxy.mjs';
async function editRage({data, document: activity, macroClass: {source}}) {
    // demiurgic colossus replaces this value
    const bonus = automationUtils.getConfigValue(activity.item, 'bonus');
    genericUtils.setProperty(data.effectData, `flags.${source}.rage.elementalCleaver`, bonus);
}
async function infuseWeapon({data, document: activity, macroClass: {identifier, source}}) {
    const formula = data.effect.flags[source]?.rage?.elementalCleaver;
    if (!formula) return Logging.addMacroWarning(source, identifier, `Elemental Cleaver is missing configs on the rage effect! (effect) ${data.effect.uuid}`);
    const weapons = activity.actor.itemTypes.weapon.filter(w => ['simpleM', 'martialM', 'simpleR', 'martialR'].includes(w.system.type.value));
    if (!weapons.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', {notify: true});
    const enchant = activity.item.effects.find(e => e.type === 'enchantment')?.toObject();
    if (!enchant) return Logging.addMacroWarning(source, identifier, `Elemental Cleaver exited early due to a missing enchantment. (actor) ${activity.actor.uuid}`);
    const types = automationUtils.getConfigValue(activity.item, 'types');
    const prev = activity.flags[source]?.elementalCleaver;
    const entries = [];
    for (const i of weapons) entries.push({
        label: i.name,
        name: i.id,
        options: {
            image: i.img,
            tooltip: await uiUtils.enrichHTML(i.system.description.value, i.getRollData())
        }
    });
    const dmg = CONFIG.DND5E.damageTypes;
    const choices = await applications.DialogApp.dialog(
        activity.item.name,
        'CHRISPREMADES.Macros.Legacy.WildSurge.SelectWeapon',
        [
            ['combobox', [{
                label: 'DND5E.DamageType',
                name: 'type',
                options: {
                    value: prev?.type ?? types[0],
                    options: types.map(d => ({
                        image: constants.damageIcons[d] ?? dmg[d].icon,
                        label: dmg[d].label,
                        value: d
                    }))
                }
            }]],
            ['button', entries, {displayAsRows: true}]
        ],
        'cancel'
    );
    if (!choices?.buttons) return Logging.addMacroWarning(source, identifier, `Elemental Cleaver exited early due to a declined prompt. (actor) ${activity.actor.uuid}`);
    addChange(enchant, {key: 'system.damage.parts',      type: 'add',      value: {custom: {enabled: true, formula}}});
    addChange(enchant, {key: 'system.damage.base.types', type: 'override', value: choices.type});
    addChange(enchant, {key: 'system.damage.types',      type: 'override', value: choices.type});
    genericUtils.setProperty(enchant, 'flags.dnd5e.dependentOn', data.effect.uuid);
    dataUtils.setOrigin(enchant, activity);
    const created = await itemUtils.enchantItem(weapons.find(i => i.id == choices.buttons), enchant);
    if (created) await documentUtils.setFlag(activity, source, 'elementalCleaver', {enchant: created.uuid, type: choices.type});
}
function addChange(enchant, change) {
    const existing = enchant.system.changes.find(c => c.key === change.key);
    if (existing) return existing.value = change.value;
    enchant.system.changes.push(change);
}
async function changeType({document: activity, macroClass: {identifier, source}}) {
    const enchant = await fromUuid(activity.flags[source]?.elementalCleaver?.enchant);
    if (!enchant) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.ElementalCleaver.NoActive', {notify: true});
    const types = automationUtils.getConfigValue(activity.item, 'types');
    const type = await dialogUtils.selectDamageType(types, activity.item.name, 'CHRISPREMADES.Macros.Legacy.AwakenedSpellbook.Select');
    if (!type) return Logging.addMacroWarning(source, identifier, `Elemental Cleaver: Change type exited early due to a declined damage type prompt. (activity) ${activity.uuid}`);
    const updates = {system: {changes: enchant.system.changes}};
    addChange(updates, {key: 'system.damage.base.types', type: 'override', value: type});
    addChange(updates, {key: 'system.damage.types',      type: 'override', value: type});
    await documentUtils.setFlag(activity, source, 'elementalCleaver.type', type);
    await documentUtils.update(enchant, updates);
}
export const elementalCleaver = {
    name: 'Elemental Cleaver',
    version: '2.1.5',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: editRage,
            priority: 250
        },
        {
            pass: 'actorRageBegin',
            macro: infuseWeapon,
            priority: 250
        }
    ],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: changeType,
            priority: 50
        }
    ],
    config: {
        bonus: {
            default: '1d6',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalCleaver.Damage'
        },
        types: {
            default: ['acid', 'cold', 'fire', 'thunder', 'lightning'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
