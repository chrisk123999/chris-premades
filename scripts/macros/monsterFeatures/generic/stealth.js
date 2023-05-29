export async function stealthCheck({speaker, actor, token, character, item, args, scope, workflow}) {
    await workflow.actor.rollSkill('ste');
}