import {actorUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function hasSeal({workflow}) {
    if (actorUtils.getItemByIdentifier(workflow.actor, 'baleful-interdict')?.system.uses.value) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.TelekineticSeal.NoSeal', {type: 'info'});
    workflow.aborted = true;
    return true;
}
async function seal({workflow}) {
    const target = workflow.targets.documents[0];
    const item = actorUtils.getItemByIdentifier(workflow.actor, 'baleful-interdict');
    const activity = item && itemUtils.getActivityByIdentifier(item, 'place-reaction');
    if (target && activity) await workflowUtils.completeActivityUse(activity, [target]);
}
export const dispatersInterdictionTelekineticSeal = {
    name: 'Dispater\'s Interdiction: Telekinetic Seal',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: hasSeal,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: seal,
            priority: 40
        }
    ]
};
