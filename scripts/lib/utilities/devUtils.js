async function setMacro(entityUuid, key, values = []) {
    if (!key) return;
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    return await entity.setFlag('chris-premades', 'macros.' + key, values);
}
export async function stripUnusedFlags(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        await i.update({
            'flags.-=ddbimporter': null,
            'flags.-=itemacro': null,
            'flags.-=cf': null,
            'flags.-=custom-character-sheet-sections': null,
            'flags.-=rest-recovery': null,
            'flags.-=exportSource': null,
            'flags.-=autoanimations': null,
            'flags.-=betterRolls5e': null,
            'flags.-=tidy5e-sheet': null,
            'flags.-=walledtemplates': null,
            'flags.-=templatemacro': null,
            'flags.-=spell-class-filter-for-5e': null,
            'flags.-=favtab': null,
            'flags.-=enhanced-terrain-layer': null,
            'flags.-=tidy5e-sheet-kgar': null,
            'flags.-=LocknKey': null,
            system: {
                description: {
                    value: '',
                    chat: ''
                }
            }
        });
    }
}
export async function updateAllCompendiums() {
    let packs = game.packs.filter(i => i.metadata.label.includes('CPR') && i.metadata.packageType === 'world');
    await Promise.all(packs.map(async i => {
        await stripUnusedFlags(i.metadata.id);
    }));
    return 'Done!';
}
export let devUtils = {
    setMacro,
    stripUnusedFlags,
    updateAllCompendiums
};