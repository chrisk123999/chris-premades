import {chris} from '../../../helperFunctions.js';
async function targets({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTargets = Array.from(workflow.targets).filter(i => chris.getSize(i.actor) <= 2).map(i => i.id);
    chris.updateTargets(validTargets);
}
async function defeated(origin) {
    await origin.use();
}
export let deathBurst = {
    'targets': targets,
    'defeated': defeated
}