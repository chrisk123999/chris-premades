import {chris} from '../../../../helperFunctions.js';
export async function charmAnimalsAndPlants({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTargets = Array.from(workflow.targets).filter(i => ['beast', 'plant'].includes(chris.raceOrType(i.actor))).map(i => i.id);
    chris.updateTargets(validTargets);
}
