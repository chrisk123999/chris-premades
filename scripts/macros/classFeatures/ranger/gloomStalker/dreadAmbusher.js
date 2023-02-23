export async function dreadAmbusher(origin) {
    if (game.combat.round != 1) return;
    await origin.use();
}