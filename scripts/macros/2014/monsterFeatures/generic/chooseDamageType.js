import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function skipDNDPrompt({workflow}) {
    const damage = workflow.activity.damage;
    if (!damage) return;
    let types = [];
    let id = workflow.activity.id;
    let data = workflow.item.toObject();
    let last = data.flags.dnd5e?.last?.[id]?.damageType;
    if (damage.includeBase && data.system.damage?.base.types.length > 1) {
        types.push(...data.system.damage.base.types);
        let defaultType = last?.[0] ?? data.system.damage.base.types[0];
        data.system.damage.base.types = [defaultType];
    }
    let activity = data.system.activities[id];
    for (let i = 0; i < activity.damage.parts.length; i++) {
        let activityTypes = activity.damage.parts[i].types;
        if (activityTypes.length <= 1) continue;
        types.push(...activityTypes);
        activity.damage.parts[i].types = [last?.[damage.includeBase + i] ?? activityTypes[0]];
    }
    if (!types.length) return;
    workflow.item = await itemUtils.syntheticItem(data, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(id);
    genericUtils.setProperty(workflow, 'workflowOptions.chris-premades.chooseDamageType', types);
}
async function damage({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'chooseDamageType');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let types = genericUtils.getProperty(workflow, 'workflowOptions.chris-premades.chooseDamageType');
    let damageTypes = Array.from(new Set([...config.damageTypes, ...types]));
    let selection = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) return;
    await workflowUtils.replaceDamage(workflow, workflow.damageRoll.formula, {damageType: selection, ignoreCrit: true});
}
export let chooseDamageType = {
    name: 'Choose Damage',
    version: '1.3.39',
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: skipDNDPrompt,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'damageTypes',
            default: []
        }
    ]
};