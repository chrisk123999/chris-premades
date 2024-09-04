async function turnStart({trigger: {entity: item}}) {
    if (game.combat.round !== 1) return;
    await item.use();
}
export let dreadAmbusher = {
    name: 'Dread Ambusher',
    version: '0.12.54',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};