import {effectUtils, genericUtils} from '../../../../utils.js';
async function change({trigger: {item}}) {
    if (item.type != 'equipment') return;
    if (item.system.type?.value != 'heavy') return;
    if (!item.actor) return;
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'fastMovementEffect');
    if (!effect) return;
    let armor = item.actor.items.find(i => i.system.equipped && i.type === 'equipment' && item.system.type?.value === 'heavy');
    if (armor && !effect.disabled) await genericUtils.update(effect, {disabled: true});
    if (!armor && effect.disabled) await genericUtils.update(effect, {disabled: false});
}
export let fastMovement = {
    name: 'Fast Movement',
    version: '1.3.105',
    rules: 'modern',
    item: [
        {
            pass: 'actorEquipped',
            macro: change
        },
        {
            pass: 'actorUnequipped',
            macro: change
        }
    ]
};