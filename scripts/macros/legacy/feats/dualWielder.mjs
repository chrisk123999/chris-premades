import {documentUtils} from '../../../proxy.mjs';
async function refresh({document: item}) {
    const effect = documentUtils.getEffectByIdentifier(item, 'dualWielder');
    if (!effect) return;
    const equipped = item.actor.items.filter(i => i.system.equipped);
    const weapons = equipped.filter(i => i.type === 'weapon' && i.system.attackType === 'melee' && !['natural', 'unarmed'].includes(i.system.type?.value) && !i.system.properties.has('two'));
    const shield = equipped.some(i => i.type === 'equipment' && i.system.type?.value === 'shield');
    const disabled = shield || weapons.length < 2;
    if (effect.disabled !== disabled) await documentUtils.update(effect, {disabled});
}
export const dualWielder = {
    name: 'Dual Wielder',
    version: '2.1.9',
    rules: '2014',
    item: [
        {
            pass: 'actorCreated',
            macro: refresh,
            priority: 50
        },
        {
            pass: 'actorDeleted',
            macro: refresh,
            priority: 50
        },
        {
            pass: 'actorEquipped',
            macro: refresh,
            priority: 50
        },
        {
            pass: 'actorUnequipped',
            macro: refresh,
            priority: 50
        }
    ]
};
