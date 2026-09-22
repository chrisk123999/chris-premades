const foreignFlags = [
    'autoanimations',
    'ddbimporter',
    'exportSource',
    'importSource',
    'infusions',
    'scene-packer',
    'spell-class-filter-for-5e',
    'tidy5e-sheet'
];
const worldReference = /^(Scene|Actor|Compendium\.world)\./;
const volatileDuration = ['startTime', 'startRound', 'startTurn'];
const keptStats = ['coreVersion', 'systemId', 'systemVersion'];
function cleanStats(document) {
    if (!document._stats) return;
    document._stats = Object.fromEntries(keptStats.map(key => [key, document._stats[key]]));
}
function cleanString(string) {
    return string.replace(/⁠/gu, '').replace(/[‘’]/gu, '\'').replace(/[“”]/gu, '"');
}
function cleanFlags(document) {
    if (!document.flags) return;
    foreignFlags.forEach(scope => delete document.flags[scope]);
    delete document.flags.core?.sourceId;
    delete document.flags.dnd5e?.last;
    delete document.flags.dnd5e?.sourceId;
    delete document.flags.dnd5e?.persistSourceMigration;
    delete document.flags.dnd5e?.advancementRoot;
    delete document.flags.dnd5e?.advancementOrigin;
    delete document.flags.dnd5e?.['-=riders'];
    if (document.flags.dnd5e?.dependents) document.flags.dnd5e.dependents = [];
    Object.entries(document.flags).forEach(([scope, contents]) => {
        if (contents && typeof contents === 'object' && !Object.keys(contents).length) delete document.flags[scope];
    });
}
/**
 * Strip world state and foreign module data that should not ship in a compendium.
 * @param {object} entry A document's source data, mutated in place.
 * @returns {void}
 */
export function cleanEntry(entry) {
    cleanStats(entry);
    delete entry.sort;
    delete entry.ownership;
    cleanFlags(entry);
    if (entry.name) entry.name = cleanString(entry.name);
    if (entry.system?.description) {
        entry.system.description.value = '';
        entry.system.description.chat = '';
    }
    if (entry.system?.source?.sourceClass) delete entry.system.source.sourceClass;
    if (entry.system?.materials?.value) entry.system.materials.value = '';
    Object.values(entry.system?.activities ?? {}).forEach(activity => cleanFlags(activity));
    (entry.effects ?? []).forEach(effect => {
        cleanStats(effect);
        cleanFlags(effect);
        if (worldReference.test(effect.origin ?? '')) effect.origin = null;
        volatileDuration.forEach(key => delete effect.duration?.[key]);
    });
    (entry.items ?? []).forEach(item => cleanEntry(item));
}
