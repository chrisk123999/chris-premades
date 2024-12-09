import {constants, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function equip(item) {
    let items = constants.unarmedAttacks.flatMap(i => itemUtils.getAllItemsByIdentifier(item.actor, i));
    if (!items.length) return;
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid
    };
    let effect = await effectUtils.createEffect(item.actor, effectData, {parentEntity: item, identifier: 'eldritchClawTattooEffect'});
    let bonus = itemUtils.getConfig(item, 'magicalBonus');
    let enchantmentData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            },
            {
                key: 'system.magicalBonus',
                mode: 2,
                value: bonus,
                priority: 20
            }
        ]
    };
    await Promise.all(items.map(async i => {
        await itemUtils.enchantItem(i, enchantmentData, {parentEntity: effect, strictlyInterdependent: true, identifier: 'eldritchClawTattooEnchantment'});
    }));
}
async function unequip(item) {
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'eldritchClawTattooEffect');
    if (effect) await genericUtils.remove(effect);
}
export let eldritchClawTattoo = {
    name: 'Eldritch Claw Tattoo',
    version: '1.1.0',
    equipment: {
        magicalStrikes: {
            equipCallback: equip,
            unequipCallback: unequip,
            favorite: true
        }
    },
    config: [
        {
            value: 'magicalBonus',
            label: 'DND5E.MagicalBonus',
            type: 'text',
            default: 1,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};