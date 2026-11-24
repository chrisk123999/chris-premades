import {dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({workflow}) {
    if (workflow.activity.identifier !== 'lands-aid' || !workflow.token) return;
    const area = workflow.targets.documents;
    workflowUtils.setWorkflowProperty(workflow, 'landsAidArea', area.map(token => token.uuid));
    if (!area.length) return;
    const preselected = Object.fromEntries(area.map(token => [token.id, token.disposition !== workflow.token.document.disposition]));
    const selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Modern.LandsAid.Damage', area, {type: 'multiple', preselected, skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)});
    const chosen = selection ? selection.result ?? [] : area.filter(token => preselected[token.id]);
    const spared = area.filter(token => !chosen.includes(token));
    if (spared.length) await workflowUtils.removeTargets(workflow, spared);
}
async function late({workflow}) {
    if (workflow.activity.identifier !== 'lands-aid') return;
    const candidates = (workflowUtils.getWorkflowProperty(workflow, 'landsAidArea') ?? []).map(uuid => fromUuidSync(uuid, {strict: false})).filter(Boolean);
    if (!candidates.length) return;
    const activity = itemUtils.getActivityByIdentifier(workflow.item, 'lands-aid-heal');
    if (!activity) return;
    const target = candidates.length > 1 ? (await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Modern.LandsAid.Select', candidates, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)}))?.result : candidates[0];
    if (target) await workflowUtils.completeActivityUse(activity, [target], {consumeResources: false});
}
export const landsAid = {
    name: 'Land\'s Aid',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        classIdentifier: {
            default: 'druid',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'lands-aid',
            classIdentifier: 'druid',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'lands-aid',
                    type: 'dice',
                    scale: {
                        3: {number: 2, faces: 6},
                        10: {number: 3, faces: 6},
                        14: {number: 4, faces: 6}
                    }
                },
                value: {},
                title: 'Land\'s Aid'
            }
        }
    ]
};
