import chalk from 'chalk';
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
function makeWarning(...rows) {
    return () => console.log(chalk.yellow('WARNING'), rows.join('\n  '));
}
function verifyConsumption(activity, item, pack) {
    const warnings = [];
    if (!activity.consumption.targets.length) return warnings;
    for (const consumption of activity.consumption.targets) {
        if (!consumption.target || consumption.type !== 'itemUses') continue;
        if (['consumable', 'equipment', 'feat'].some(t => consumption.target.startsWith(t))) continue;
        warnings.push(makeWarning(
            'Broken item consumption!',
            `${item.name} > ${activity.name || activity.type}`,
            `Pack: ${pack} | Item: ${item._id} | Activity: ${activity._id}`
        ));
    }
    return warnings;
}
function verifyAutomationInfo(item, pack) {
    const missing = [];
    item.flags.cat ??= {};
    item.flags.cat.automation ??= {};
    if (!item.flags.cat.automation.source) {
        item.flags.cat.automation.source = 'chris-premades';
        missing.push('Source (Auto Fix)');
    }
    if (!item.flags.cat.automation.version || item.flags.cat.automation.version === '0')
        missing.push('Version');
    if (!missing.length) return;
    return makeWarning(
        'Missing automation info!',
        `${item.name} > ${missing.join(', ')}`,
        `Pack: ${pack} | Item: ${item._id}`
    );
}
/**
 * Strip world state and foreign module data that should not ship in a compendium.
 * @param {object} entry A document's source data, mutated in place.
 * @returns {void}
 */
export function cleanEntry(entry, pack) {
    const warnings = [];
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
    if (entry.system?.sourceClass === '') delete entry.system.sourceClass;
    if (entry.system?.preparation && entry.system.method !== undefined) delete entry.system.preparation;
    if (entry.system?.materials?.value) entry.system.materials.value = '';
    Object.values(entry.system?.activities ?? {}).forEach(activity => {
        warnings.push(...verifyConsumption(activity, entry, pack));
        cleanFlags(activity);
    });
    (entry.effects ?? []).forEach(effect => {
        cleanStats(effect);
        cleanFlags(effect);
        if (effect.description) effect.description = '';
        if (effect.flags?.dae?.showIcon === false) delete effect.flags.dae.showIcon;
        if (worldReference.test(effect.origin ?? '')) effect.origin = null;
        Object.entries(effect.system?.origin ?? {}).forEach(([key, uuid]) => {
            if (worldReference.test(uuid ?? '')) delete effect.system.origin[key];
        });
        delete effect.start;
        volatileDuration.forEach(key => delete effect.duration?.[key]);
    });
    (entry.items ?? []).forEach(item => cleanEntry(item));
    if (pack !== 'cpr-automation-items' && entry.system?.activities) {
        const missingInfo = verifyAutomationInfo(entry, pack);
        if (missingInfo) warnings.push(missingInfo);
    }
    return warnings;
}
