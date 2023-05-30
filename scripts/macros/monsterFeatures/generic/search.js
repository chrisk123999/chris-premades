export async function search({speaker, actor, token, character, item, args, scope, workflow}) {
    await workflow.actor.rollSkill('prc');
}