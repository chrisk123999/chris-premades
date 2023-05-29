export async function fuming({speaker, actor, token, character, item, args, scope, workflow}) {
    let feature = workflow.actor.items.getName('Fuming');
    if (!feature) return;
    await feature.use();
}