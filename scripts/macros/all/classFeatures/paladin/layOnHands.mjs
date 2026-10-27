import {actorUtils, documentUtils, Logging} from '../../../../proxy.mjs';
const statuses = {
    poison: {status: 'poisoned', missing: 'CHRISPREMADES.Macros.All.LayOnHands.NoPoison'},
    disease: {status: 'diseased', missing: 'CHRISPREMADES.Macros.All.LayOnHands.NoDisease'}
};
async function early({activity}) {
    const entry = statuses[activity.identifier];
    if (!entry) return;
    const targetActor = game.user.targets.first()?.actor;
    if (!targetActor) return;
    if (actorUtils.getEffectByStatusID(targetActor, entry.status)) return;
    Logging.addMacroWarning('CPR', 'lay-on-hands', entry.missing, {notify: 'info'});
    return true;
}
async function cure({workflow}) {
    const status = statuses[workflow.activity?.identifier]?.status;
    if (!status) return;
    if (!workflow.targets.size) return Logging.addMacroWarning('CPR', 'lay-on-hands', 'No target selected.');
    const effect = actorUtils.getEffectByStatusID(workflow.targets.first().actor, status);
    if (effect) await documentUtils.deleteDocument(effect);
}
export const layOnHands = {
    name: 'Lay On Hands',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: cure,
            priority: 50
        }
    ]
};
