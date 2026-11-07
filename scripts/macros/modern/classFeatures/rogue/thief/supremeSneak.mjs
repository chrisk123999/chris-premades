import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
function getHiding(actor) {
    return actorUtils.getEffectByStatusID(actor, 'hiding');
}
async function preamble({workflow}) {
    const hiding = getHiding(workflow.actor);
    if (hiding) workflowUtils.setWorkflowProperty(workflow, 'supremeSneakHiding', hiding.toObject());
}
async function rollFinished({document: item, workflow}) {
    const hidingData = workflowUtils.getWorkflowProperty(workflow, 'supremeSneakHiding');
    const riders = workflowUtils.getWorkflowProperty(workflow, 'attackRiders') ?? [];
    if (!hidingData || !item.system.activities.some(activity => riders.includes(activity.uuid))) return;
    const hiding = getHiding(workflow.actor);
    if (hiding) {
        await documentUtils.setFlag(hiding, 'chris-premades', 'supremeSneak', true);
        return;
    }
    genericUtils.setProperty(hidingData, 'flags.chris-premades.supremeSneak', true);
    await effectUtils.createEffects(workflow.actor, [hidingData], {effectOptions: {keepId: true}});
}
async function turnEnd({document: item, actor}) {
    const hiding = getHiding(actor);
    if (!hiding?.flags['chris-premades']?.supremeSneak) return;
    const keep = await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.SupremeSneak.TurnEnd'), {userId: queryUtils.firstOwner(actor, true)});
    if (keep) await documentUtils.setFlag(hiding, 'chris-premades', 'supremeSneak', false);
    else await documentUtils.deleteDocument(hiding);
}
export const supremeSneak = {
    name: 'Supreme Sneak',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: preamble,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: rollFinished,
            priority: 400
        }
    ],
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
