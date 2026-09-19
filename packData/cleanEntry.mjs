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
 * Shared by `unpackData.mjs`, which runs it on extraction, and `cleanData.mjs`, which runs it over
 * source files that were hand edited rather than extracted.
 * @param {object} entry A document's source data, mutated in place.
 * @returns {void}
 */
export function cleanEntry(entry) {
    delete entry._stats;
    delete entry.sort;
    delete entry.ownership;
    cleanFlags(entry);
    if (entry.name) entry.name = cleanString(entry.name);
    if (entry.system?.description?.value) entry.system.description.value = cleanString(entry.system.description.value);
    if (entry.system?.source?.sourceClass) delete entry.system.source.sourceClass;
    if (entry.system?.materials?.value) entry.system.materials.value = '';
    Object.values(entry.system?.activities ?? {}).forEach(activity => cleanFlags(activity));
    (entry.effects ?? []).forEach(effect => {
        delete effect._stats;
        cleanFlags(effect);
        if (worldReference.test(effect.origin ?? '')) effect.origin = null;
    });
    (entry.items ?? []).forEach(item => cleanEntry(item));
}
