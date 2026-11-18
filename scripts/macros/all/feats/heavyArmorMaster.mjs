import {documentUtils} from '../../../proxy.mjs';
async function sync({document: item}) {
    if (!item.actor) return;
    const disabled = item.actor.system.attributes.ac.equippedArmor?.system.type.value !== 'heavy';
    for (const effect of item.effects.filter(effect => effect.flags.dae?.disableCondition && effect.disabled !== disabled)) {
        await documentUtils.update(effect, {disabled});
    }
}
export const heavyArmorMaster = {
    name: 'Heavy Armor Master',
    version: '2.1.9',
    rules: 'all',
    item: [
        {
            pass: 'created',
            macro: sync,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: sync,
            priority: 50
        },
        {
            pass: 'munched',
            macro: sync,
            priority: 50
        },
        {
            pass: 'actorCreated',
            macro: sync,
            priority: 50
        },
        {
            pass: 'actorDeleted',
            macro: sync,
            priority: 50
        }
    ]
};
