import {effectUtils, genericUtils} from '../../../../utils.js';
async function change({trigger: {item}}) {
    if (item.type != 'equipment') return;
    if (!item.actor) return;
    if (!['heavy', 'medium'].includes(item.system.type?.value)) return;
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'flightEffect');
    if (!effect) return;
    let armor = item.actor.items.find(i => i.system.equipped && i.type === 'equipment' && ['heavy', 'medium'].includes(item.system.type?.value));
    if (armor && !effect.disabled) await genericUtils.update(effect, {disabled: true});
    if (!armor && effect.disabled) await genericUtils.update(effect, {disabled: false});
}
export let fairyFlight = {
    name: 'Flight',
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