import {documentUtils} from '../../../proxy.mjs';
async function recast({workflow}) {
    const enchantments = workflow.item.system.activities.getByType('enchant').flatMap(activity => activity.appliedEnchantments);
    await Promise.all(enchantments.map(enchantment => documentUtils.deleteDocument(enchantment)));
}
export const magicWeapon = {
    name: 'Magic Weapon',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: recast,
            priority: 50
        }
    ]
};
