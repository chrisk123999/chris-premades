import {constants, effectUtils, genericUtils} from '../../../utils.js';

async function change({trigger: {item}}) {
    if (item.type !== 'equipment') return;
    let actor = item.actor;
    if (!actor) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'defense');
    if (!effect) return;
    let armor = constants.armorTypes.includes(actor.system.attributes.ac.equippedArmor?.system?.type?.value);
    if (armor && effect.disabled) await genericUtils.update(effect, {disabled: false});
    if (!armor && !effect.disabled) await genericUtils.update(effect, {disabled: true});
}
export let defense = {
    name: 'Defense',
    version: '1.2.36',
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
    ],
};