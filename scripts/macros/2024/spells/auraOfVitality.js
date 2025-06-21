import {activityUtils, dialogUtils, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                auraOfVitality: {
                    range: workflow.item.system.target.template.size,
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        strictlyInterdependent: true,
        identifier: 'auraOfVitalityEffect',
        rules: 'modern',
        macros: [
            {type: 'combat', macros: ['auraOfVitalityEffect']}
        ]
    });
    let nearbyTokens = tokenUtils.findNearby(trigger.token, workflow.item.system.target.template.size, 'ally', {includeToken: true});
    if (!nearbyTokens.length) return;
    let selection;
    if (nearbyTokens.length === 1) {
        selection = nearbyTokens[0];
    } else {
        selection = await dialogUtils.selectTargetDialog(trigger.entity.name, 'CHRISPREMADES.MACROS.AuraOfVitality.Select', nearbyTokens, {skipDeadAndUnconscious: false});
        if (!selection?.length) return;
        selection = selection[0];
    }
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'auraOfVitalityHealing', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [selection]);
}
async function turnStart({trigger}) {
    let range = trigger.entity.flags['chris-premades']?.auraOfVitality?.range ?? genericUtils.handleMetric(30);
    let nearbyTokens = tokenUtils.findNearby(trigger.token, range, 'ally', {includeToken: true});
    if (!nearbyTokens.length) return;
    let selection;
    if (nearbyTokens.length === 1) {
        selection = nearbyTokens[0];
    } else {
        selection = await dialogUtils.selectTargetDialog(trigger.entity.name, 'CHRISPREMADES.MACROS.AuraOfVitality.Select', nearbyTokens, {skipDeadAndUnconscious: false});
        if (!selection?.length) return;
        selection = selection[0];
    }
    let origin = await effectUtils.getOriginItem(trigger.entity);
    if (!origin) return;
    let activity = activityUtils.getActivityByIdentifier(origin, 'auraOfVitalityHealing', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [selection]);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let auraOfVitality = {
    name: 'Aura of Vitality',
    version: '1.2.28',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['auraOfVitality']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['auraOfVitalityHealing']
            }
        ]
    }
};
export let auraOfVitalityEffect = {
    name: auraOfVitality.name,
    version: auraOfVitality.version,
    rules: 'modern',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};