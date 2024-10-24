import {actorUtils, genericUtils, workflowUtils} from '../../../utils.js';

async function damageDawn({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (actorUtils.typeOrRace(workflow.hitTargets.first().actor) !== 'undead') return;
    let enchant = Array.from(workflow.item.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'crimsonRite');
    if (!enchant) return;
    if (enchant.flags['chris-premades']?.crimsonRite?.chosenRite !== 'riteOfTheDawn') return;
    let damageDice = workflow.actor.system.scale?.['blood-hunter']?.['crimson-rite'];
    if (!damageDice) return;
    await workflowUtils.bonusDamage(workflow, damageDice + '[radiant]', {damageType: 'radiant'});
}
let version = '0.12.64';
export let riteOfTheDawn = {
    name: 'Crimson Rite: Rite of the Dawn',
    version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damageDawn,
                priority: 50
            }
        ]
    },
    ddbi: {
        renamedItems: {
            'Crimson Rite - Rite of the Dawn': 'Crimson Rite: Rite of the Dawn'
        }
    }
};
export let riteOfTheDead = {
    name: 'Crimson Rite: Rite of the Dead',
    version
};
export let riteOfTheFlame = {
    name: 'Crimson Rite: Rite of the Flame',
    version
};
export let riteOfTheFrozen = {
    name: 'Crimson Rite: Rite of the Frozen',
    version
};
export let riteOfTheOracle = {
    name: 'Crimson Rite: Rite of the Oracle',
    version
};
export let riteOfTheRoar = {
    name: 'Crimson Rite: Rite of the Roar',
    version
};
export let riteOfTheStorm = {
    name: 'Crimson Rite: Rite of the Storm',
    version
};