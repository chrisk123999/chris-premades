import {automationUtils, constants, dialogUtils, itemUtils} from '../../../../../proxy.mjs';
async function getActivityData({document, workflow}) {
    const activityData = workflow.activity.toObject();
    const mode = automationUtils.getConfigValue(document, 'changeDamage');
    if (mode === 'never' || !workflow.activity.hasDamage) return activityData;
    const damageType = automationUtils.getConfigValue(document, 'damageType');
    if (workflow.defaultDamageType === damageType) return activityData;
    if (mode === 'prompt') {
        const from = CONFIG.DND5E.damageTypes[workflow.defaultDamageType]?.label;
        const to = CONFIG.DND5E.damageTypes[damageType]?.label;
        if (!await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Modern.PsychicSpells.ChangeDamage', {from, to}))) return activityData;
    }
    activityData.damage.parts.forEach(part => part.types = [damageType]);
    return activityData;
}
async function early({document, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.sourceClass !== automationUtils.getConfigValue(document, 'classIdentifier')) return;
    const itemData = workflow.item.toObject();
    itemData.system.activities[workflow.activity.id] = await getActivityData({document, workflow});
    const schools = automationUtils.getConfigValue(document, 'spellSchools');
    if (schools.includes(workflow.item.system.school)) itemData.system.properties = itemData.system.properties.filter(property => !['vocal', 'somatic'].includes(property));
    workflow.item = itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export const psychicSpells = {
    name: 'Psychic Spells',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'actorPreItemRoll', macro: early, priority: 50}
    ],
    config: {
        classIdentifier: {
            default: 'warlock',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        changeDamage: {
            default: 'always',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Modern.PsychicSpells.ChangeDamageMode',
            category: 'homebrew',
            get options() { return ['always', 'prompt', 'never'].map(value => ({value, label: _loc('CHRISPREMADES.Macros.Modern.PsychicSpells.Modes.' + value)})); }
        },
        damageType: {
            default: 'psychic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        },
        spellSchools: {
            default: ['enc', 'ill'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.SpellSchools',
            category: 'homebrew',
            get options() { return constants.spellSchoolOptions(); }
        }
    }
};
