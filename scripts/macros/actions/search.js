import {chris} from '../../helperFunctions.js';
export async function search({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('What Skill?', [['Perception', 'prc'], ['Investigation', 'inv']]);
    if (!selection) return;
    await workflow.actor.rollSkill(selection);
}