import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let template = workflow.template;
    if (!template) return;
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['greaseArea']
                }
            }
        }
    });
}
async function enterOrEnd({trigger: {entity: template, castData, token}}) {
    if (actorUtils.checkTrait(token.actor, 'ci', 'prone')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'prone')) return;
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'greaseFall', {strict: true});
    if (!feature) return;
    let saveWorkflow = await workflowUtils.syntheticActivityRoll(feature, [token]);
    if (saveWorkflow.failedSaves.size) await effectUtils.applyConditions(token.actor, ['prone']);
}
export let grease = {
    name: 'Grease',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let greaseArea = {
    name: 'Grease: Area',
    version: grease.version,
    template: [
        {
            pass: 'enter',
            macro: enterOrEnd,
            priority: 50
        },
        {
            pass: 'turnEnd',
            macro: enterOrEnd,
            priority: 50
        }
    ]
};