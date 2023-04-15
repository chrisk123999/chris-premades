export async function regeneration(actor, origin) {
    if (actor.system.attriburtes.hp.value != 0) await origin.use();
}