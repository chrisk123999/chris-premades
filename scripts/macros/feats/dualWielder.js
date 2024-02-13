import {chris} from '../../helperFunctions.js';
export async function dualWielder(item, updates, options, userId) {
    if (item.type != 'weapon' && item.type != 'equipment') return;
    let actor = item.actor;
    if (!actor) return;
    let effect = chris.findEffect(actor, 'Dual Wielder');
    if (!effect) return;
    let items = actor.items.filter(i => i.type==='weapon' && i.system.equipped);
    console.log(items);
    let shields = actor.items.filter(i => i.system.armor?.type === 'shield' && i.system.equipped);
    console.log(shields);
    if (shields.length) {
        if (!effect.disabled) await effect.update({'disabled': true});
        return;
    }
    if (items.length > 1 && effect.disabled) await effect.update({'disabled': false});
    if (items.length <= 1 && !effect.disabled) await effect.update({'disabled': true});
}