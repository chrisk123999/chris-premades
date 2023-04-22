export async function regeneration(actor, origin) {
    if (actor.system.attributes.hp.value != 0) await origin.use();
}