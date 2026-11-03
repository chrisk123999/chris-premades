import {documentUtils, effectUtils, itemUtils} from '../../../proxy.mjs';
const conversion = {bludgeoning: 'thunder', piercing: 'lightning', slashing: 'lightning'};
async function transform({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    const weapons = actor.items.filter(item => item.type === 'weapon' && Array.from(item.system.damage?.base?.types ?? []).some(type => conversion[type]));
    for (const weapon of weapons) {
        const types = Array.from(new Set(Array.from(weapon.system.damage.base.types, type => conversion[type] ?? type)));
        await itemUtils.enchantItem(weapon, {
            name: effect.name,
            img: effect.img,
            origin: effect.uuid,
            system: {changes: types.map((type, index) => ({key: 'system.damage.base.types', type: index ? 'add' : 'override', value: type, phase: 'initial', priority: 20 + index}))},
            flags: {cat: {identifier: 'stormAvatarEnchantment'}}
        });
    }
}
async function revert({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    const enchantments = actor.items.contents.flatMap(item => item.effects.filter(enchantment => enchantment.flags.cat?.identifier === 'stormAvatarEnchantment'));
    for (const enchantment of enchantments) await documentUtils.deleteDocument(enchantment);
}
export const stormgirdleAvatar = {
    name: 'Stormgirdle: Storm Avatar',
    version: '2.1.7',
    rules: '2014',
    effect: [
        {
            pass: 'created',
            macro: transform,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: revert,
            priority: 50
        }
    ]
};
