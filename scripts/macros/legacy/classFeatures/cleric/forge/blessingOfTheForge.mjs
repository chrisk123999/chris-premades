import {activityUtils, applications, automationUtils, constants, dataUtils, documentUtils, effectUtils, itemUtils, Logging, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
function fetchItems(actor, token, config) {
    const actors = [actor];
    const items = new Map();
    if (token) actors.push(...tokenUtils.findNearby(token, 999, {disposition: 'ally'}).map(t => t.actor));
    for (const a of actors) {
        if (!a) continue;
        const group = items.get(a.uuid) ?? [];
        group.push(...a.itemTypes.equipment.filter(e =>
            (!config.nonmagic || !e.system.properties.has('mgc')) &&
            (!config.armor.length || config.armor.includes(e.system.type.value)) &&
            !group.some(i => i.uuid === e.uuid)
        ));
        group.push(...a.itemTypes.weapon.filter(w =>
            (!config.nonmagic || !w.system.properties.has('mgc')) &&
            (!config.weapon.length || config.weapon.includes(w.system.type.value)) &&
            !group.some(i => i.uuid === w.uuid)
        ));
        if (group.length) items.set(a.uuid, group);
    }
    return items;
}
async function stop(workflow, source, identifier, message, options) {
    Logging.addMacroWarning(source, identifier, message, options);
    await workflowUtils.refundUse(workflow);
}
const makeButton = async item => ({
    label: item.name,
    name: item.uuid,
    options: {
        image: item.img,
        tooltip: await uiUtils.enrichHTML(item.system.description.value, item.getRollData())
    }
});
async function blessItem({document: activity, macroClass: {identifier, source}, workflow}) {
    const effects = ['blessingOfTheForge', 'blessingForgedArmor', 'blessingForgedWeapon'].reduce((obj, id) => {
        const data = documentUtils.getEffectByIdentifier(activity.item, id)?.toObject();
        if (!data) return Logging.addMacroWarning(source, identifier, `Blessing of the Forge could not locate an active effect. (activity) ${activity.uuid} (effect identifier) ${id}`);
        data.duration = activityUtils.getEffectDuration(activity);
        dataUtils.setOrigin(data, activity);
        obj[id] = data;
        return obj;
    }, {});
    if (!effects.blessingOfTheForge || !effects.blessingForgedArmor || !effects.blessingForgedWeapon) return;
    const items = fetchItems(workflow.actor, workflow.tokenDocument, automationUtils.getConfigValues(activity.item, Object.keys(blessingOfTheForge.config)));
    if (!items.size) return stop(workflow, source, identifier, _loc('CHRISPREMADES.Macros.Legacy.BlessingOfTheForge.NoItems', {feature: activity.item.name}), {notify: 'warn'});
    const inputs = [];
    for (const group of items.values()) inputs.push(['button', await Promise.all(group.map(i => makeButton(i))), {displayAsRows: true, legend: group[0].actor.name}]);
    const choice = await applications.DialogApp.dialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Legacy.BlessingOfTheForge.Prompt', {feature: activity.item.name}), inputs, 'cancel');
    const item = await fromUuid(choice?.buttons);
    if (!item) return await workflowUtils.refundUse(workflow);
    const enchant = await itemUtils.enchantItem(item, item.type === 'equipment' ? effects.blessingForgedArmor : effects.blessingForgedWeapon);
    if (!enchant) return stop(workflow, source, identifier, `Blessing of the Forge failed to create an enchantment. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    effects.blessingOfTheForge.name = `[${item.actor.name}] ${workflow.item.name}`;
    const parent = (await effectUtils.createEffects(workflow.actor, [effects.blessingOfTheForge], {parentEntity: enchant}))?.[0];
    if (parent) return await documentUtils.makeDependent(parent, [enchant]);
    stop(workflow, source, identifier, `Blessing of the Forge failed to create parent effect. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    await documentUtils.deleteDocument(enchant);
}
export const blessingOfTheForge = {
    name: 'Blessing of the Forge',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: blessItem,
            priority: 50
        }
    ],
    config: {
        armor: {
            default: ['light', 'medium', 'heavy'],
            type: 'select-many',
            category: 'behavior',
            label: 'DND5E.Armor',
            get options() { return constants.armorOptions; }
        },
        weapon: {
            default: ['simpleM', 'simpleR', 'martialM', 'martialR'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Weapon',
            get options() { return constants.weaponTypes; }
        },
        nonmagic: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.BlessingOfTheForge.NonmagicalOnly'
        }
    }
};
