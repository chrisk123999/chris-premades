async function addSpells({data}) {
    if (!data.keepItems) return;
    const legacyComponents = data.rules === '2014' && data.classLevel < 20;
    data.keepItems.push(...data.actor.itemTypes.spell.filter(i => {
        if (data.rules === '2014' && i.system.classIdentifier !== data.classIdentifier) return false;
        if (legacyComponents && i.system.properties.has('material')) return false;
        if (i.system.materials.cost > 0) return false;
        if (i.system.materials.consumed) return false;
        if (data.keepItems.some(j => j.id === i.id)) return false;
        if (data.newActor.itemTypes.spell.some(j => j.id === i.id)) return false;
        return true;
    }));
}
export const beastSpells = {
    name: 'Beast Spells',
    rules: 'all',
    version: '2.0.3',
    called: [
        {
            pass: 'actorWildShape',
            macro: addSpells,
            priority: 200
        }
    ]
};
