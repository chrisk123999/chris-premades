export async function fuming({speaker, actor, token, character, item, args}) {
    let feature = this.actor.items.getName('Fuming');
    if (!feature) return;
    await feature.use();
}