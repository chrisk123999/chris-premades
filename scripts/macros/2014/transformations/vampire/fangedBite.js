import {activityUtils, actorUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.Transformations.Vampire.FangedBite.HasBlood');
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'blood', {strict: true});
    if (!activity) return;
    let targetWorkflow = await workflowUtils.syntheticActivityRoll(activity, Array.from(workflow.hitTargets));
    if (!targetWorkflow.failedSaves.size) return;
    await workflowUtils.bonusDamage(workflow, itemUtils.getConfig(workflow.item, 'formula'), {ignoreCrit: true, damageType: itemUtils.getConfig(workflow.item, 'damageType')});
    genericUtils.setProperty(workflow, 'chris-premades.fangedBiteFailed', true);
}
async function use({trigger, workflow}) {
    if (!workflow['chris-premades']?.fangedBiteFailed) return;
    let total = workflowUtils.getTotalDamageOfType(workflow.damageDetail, workflow.targets.first().actor, itemUtils.getConfig(workflow.item, 'damageType'));
    if (!total) return;
    await workflowUtils.applyDamage([workflow.token], total, 'healing');
}
async function early({trigger, workflow}) {
    let ability = actorUtils.getBestAbility(workflow.actor, ['str', 'dex']);
    if (ability === 'str') return;
    let activity = workflow.activity.clone({'attack.ability': ability}, {keepId: true});
    activity.prepareData();
    activity.prepareFinalData();
    workflow.activity = activity;
}
export let vampireFangedBite = {
    name: 'Stage 1 Boon: Fanged Bite',
    version: '1.4.6',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50,
                activities: ['bite']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['bite']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d6',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'stage',
            label: 'CHRISPREMADES.Config.Stage',
            type: 'select',
            default: '1',
            category: 'mechanics',
            options: [
                {
                    label: 'CHRISPREMADES.Generic.One',
                    value: '1'
                },
                {
                    label: 'CHRISPREMADES.Generic.Two',
                    value: '2'
                },
                {
                    label: 'CHRISPREMADES.Generic.Three',
                    value: '3'
                },
                {
                    label: 'CHRISPREMADES.Generic.Four',
                    value: '4'
                }
            ]
        }
    ]
};