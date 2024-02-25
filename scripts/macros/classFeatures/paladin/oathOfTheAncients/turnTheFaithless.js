import {chris} from '../../../../helperFunctions.js';
export async function turnTheFaithless({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTypes = ['fey', 'fiend'];
    let validTargets = Array.from(workflow.targets).filter(i => validTypes.includes(chris.raceOrType(i.actor))).map(j => j.id);
    chris.updateTargets(validTargets);
}