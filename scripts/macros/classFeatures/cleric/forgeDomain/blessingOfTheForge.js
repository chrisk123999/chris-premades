import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetActor = workflow.targets.first()?.actor;
    if (!targetActor) return;
    let weapons = targetActor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.equipped);
    let armor = targetActor.items.filter(i => i.system.isArmor && i.system.type?.value !== 'shield' && !i.system.properties.has('mgc') && i.system.equipped);
    let validChoices = [...weapons, ...armor];
    if (!validChoices.length) {
        genericUtils.notify('CHRISPREMADES.Macros.BlessingOfTheForge.None', 'info');
        return;
    }
    let selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.BlessingOfTheForge.Select', validChoices);
    if (!selectedItem) return;
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + workflow.item.name + ')',
                priority: 20
            },
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            },
            {
                key: selectedItem.system.isArmor ? 'system.armor.magicalBonus' : 'system.magicalBonus',
                mode: 5,
                value: 1,
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(selectedItem, enchantData, {identifier: 'blessingOfTheForge'});
    let blessedUuids = workflow.item.flags['chris-premades']?.blessingOfTheForge?.uuids ?? [];
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'blessingOfTheForge.uuids', blessedUuids.concat(selectedItem.uuid));
}
async function longRest({trigger: {entity: item}}) {
    for (let uuid of (item.flags['chris-premades']?.blessingOfTheForge?.uuids ?? [])) {
        let currItem = await fromUuid(uuid);
        if (!currItem) continue;
        let enchantEffect = Array.from(currItem.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'blessingOfTheForge');
        if (enchantEffect) await genericUtils.remove(enchantEffect);
    }
    await genericUtils.setFlag(item, 'chris-premades', 'blessingOfTheForge.uuids', []);
}
export let blessingOfTheForge = {
    name: 'Blessing of the Forge',
    version: '0.12.37',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ]
};