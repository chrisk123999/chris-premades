import {genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'grappleAttackAdvantage');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let advantage = workflow.targets.find(token => tokenUtils.isGrappledBy(token, workflow.token));
    if (!advantage) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + workflow.item.name);
}
async function damage({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'grappleAttackAdvantage');
    if (!config.bonusDamage) return;
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let doBonus = workflow.targets.find(token => tokenUtils.isGrappledBy(token, workflow.token));
    if (!doBonus) return;
    await workflowUtils.bonusDamage(workflow, config.bonusDamage);
}
export let grappleAttackAdvantage = {
    name: 'Grapple Attack Advantage',
    translation: 'CHRISPREMADES.Macros.ArappleAttackAdvantage.Name',
    version: '1.3.134',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: use,
                priority: 100
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
            value: 'bonusDamage',
            label: 'CHRISPREMADES.Macros.Config.BonusDamage',
            type: 'text',
            default: ''
        }
    ]
};