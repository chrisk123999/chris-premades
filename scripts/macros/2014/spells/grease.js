import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';

async function use({workflow}) {
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
    await workflowUtils.syntheticActivityRoll(feature, [token]);
}
export let grease = {
    name: 'Grease',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['grease']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['greaseFall']
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