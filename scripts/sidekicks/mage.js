import {chris} from '../helperFunctions.js';

async function optimized(token, level) {
    let updates = {};
    let actorData = duplicate(token.actor.toObject());
    setProperty(updates, 'actor.system.abilities.wis.proficient', 1);
    setProperty(updates, 'actor.system.skills.arc.proficent', 1);
    setProperty(updates, 'actor.system.skills.his.proficent', 1);
    if (!token.actor.system.traits.armorProf.value.has('lgt')) {
        let lightArmor = false;
        if (chris.raceOrType(token.actor) === 'humanoid') lightArmor = true;
        if (!lightArmor) {
            let weapons = token.actor.items.find(i => i.type === 'weapon');
            if (weapons.length) lightArmor = true;
        }
        if (lightArmor) setProperty(updates, 'actor.system.traits.armorProf.value', actorData.system.traits.armorProf.value.concat(['lgt']));
    }
    if (!actor.system.traits.weaponProf.value.has('sim')) setProperty(updates, 'actor.system.traits.weaponProf.value', actorData.system.traits.weaponProf.value.concat(['sim']));
    
}