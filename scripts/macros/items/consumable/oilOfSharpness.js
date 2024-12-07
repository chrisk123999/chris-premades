import {dialogUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    let weapons = actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.damage.parts.find(j => ['piercing', 'slashing'].includes(j[1])));
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.HexWarrior.NoWeapons', 'info');
        return;
    }
    let selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.OilOfSharpness.Select', weapons);
    if (!selectedWeapon) return;
    let enchant = Array.from(selectedWeapon.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'oilOfSharpness');
    if (enchant) await genericUtils.remove(enchant);
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
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
                key: 'system.magicalBonus',
                mode: 2,
                value: 3,
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(selectedWeapon, enchantData, {identifier: 'oilOfSharpness'});
}
export let oilOfSharpness = {
    name: 'Oil of Sharpness',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};