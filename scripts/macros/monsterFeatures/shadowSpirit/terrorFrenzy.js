import {chris} from '../../../helperFunctions.js';
export async function terrorFrenzy({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Frightened');
    if (!effect) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution['Terror Frenzy'] = true;
}