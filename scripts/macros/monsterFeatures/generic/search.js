export async function search({speaker, actor, token, character, item, args}) {
    await this.actor.rollSkill('prc');
}