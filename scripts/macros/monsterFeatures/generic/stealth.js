export async function stealthCheck({speaker, actor, token, character, item, args}) {
    await this.actor.rollSkill('ste');
}