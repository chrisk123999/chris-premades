import {effectUtils, genericUtils} from '../../../../utils.js';
async function create({trigger: {entity: item, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = item.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.aura', true);
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier
        }
    };
}
export let auraOfAuthority = {
    name: 'Aura of Authority',
    version: '1.3.150',
    rules: 'modern',
    monsters: [
        'Hobgoblin Captain'
    ],
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 10,
            identifier: 'auraOfAuthorityAura',
            disposition: 'ally',
            incapacitated: true
        }
    ]
};