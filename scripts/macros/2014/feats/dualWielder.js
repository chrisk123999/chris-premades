import {effectUtils, genericUtils} from '../../../utils.js';

async function change({trigger: {item}}) {
    if (item.type !== 'weapon' && item.type !== 'equipment') return;
    let actor = item.actor;
    if (!actor) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'dualWielder');
    if (!effect) return;
    let items = actor.items.filter(i => i.system.equipped && i.type === 'weapon' && item.system.actionType === 'mwak');
    let shields = actor.items.filter(i => i.system.equipped && i.system.type?.value === 'shield');
    if (shields.length) {
        if (!effect.disabled) await genericUtils.update(effect, {disabled: true});
        return;
    }
    if (items.length > 1 && effect.disabled) await genericUtils.update(effect, {disabled: false});
    if (items.length < 2 && !effect.disabled) await genericUtils.update(effect, {disabled: true});
}
export let dualWielder = {
    name: 'Dual Wielder',
    version: '1.2.36',
    item: [
        {
            pass: 'actorEquipped',
            macro: change
        },
        {
            pass: 'actorUnequipped',
            macro: change
        }
    ],
};