import {effectUtils, genericUtils} from '../../../../utils.js';
async function change({trigger: {item}}) {
    if (item.type != 'equipment') return;
    if (item.system.type?.value != 'heavy') return;
    if (!item.actor) return;
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'unarmoredDefenseBarbarianEffect');
    if (!effect) return;
    let invalidTypes = ['heavy', 'medium', 'light'];
    let armor = item.actor.items.find(i => i.system.equipped && i.type === 'equipment' && invalidTypes.includes(item.system.type?.value));
    if (armor && !effect.disabled) await genericUtils.update(effect, {disabled: true});
    if (!armor && effect.disabled) await genericUtils.update(effect, {disabled: false});
}
export let unarmoredDefenseBarbarian = {
    name: 'Unarmored Defense (Barbarian)',
    aliases: ['Unarmored Defense'],
    version: '1.1.138',
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
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        restrictedItems: {
            'Unarmored Defense 1': {
                originalName: 'Unarmored Defense',
                requiredClass: 'Barbarian',
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Unarmored Defense (Barbarian)',
                removedItems: [],
                additionalItems: [],
                priority: 0
            },
        }
    }
};