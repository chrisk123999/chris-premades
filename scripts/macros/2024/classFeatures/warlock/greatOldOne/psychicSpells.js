import {constants, dialogUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    if (workflow.item.system.sourceClass !== classIdentifier) return;
    let itemData = workflow.item.toObject();
    itemData.system.activities[workflow.activity.id] = await getDamage(item, workflow);
    let schools = itemUtils.getConfig(item, 'spellSchools');
    if (schools.some(s => workflow.item.system.school === s))
        itemData.system.properties = itemData.system.properties.filter(p => !['vocal', 'somatic'].some(exclude => p === exclude));
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function getDamage(item, workflow) {
    let activityData = workflow.activity.toObject();
    let auto = itemUtils.getConfig(item, 'changeDamage');
    if (auto === 'never' || !workflow.activity.hasDamage) return activityData;
    let damageType = itemUtils.getConfig(item, 'damageType');
    if (workflow.defaultDamageType === damageType) return activityData;
    if (auto === 'prompt') {
        let change = ' (' + CONFIG.DND5E.damageTypes[workflow.defaultDamageType]?.label + ' -> ' + CONFIG.DND5E.damageTypes[damageType]?.label + ')';
        let prompt = genericUtils.translate('CHRISPREMADES.Macros.AwakenedSpellbook.Select') + change;
        if (!await dialogUtils.confirm(item.name, prompt)) return activityData;
    }
    activityData.damage.parts.forEach(p => p.types = [damageType]);
    return activityData;
}
export let psychicSpells = {
    name: 'Psychic Spells',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preItemRoll',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'warlock',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'changeDamage',
            label: 'CHRISPREMADES.Macros.AwakenedSpellbook.Select',
            type: 'select',
            default: 'always',
            options: constants.autoOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellSchools',
            label: 'CHRISPREMADES.Config.SpellSchools',
            type: 'select-many',
            default: ['enc', 'ill'],
            options: constants.spellSchoolOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
