import {dialogUtils, documentUtils, genericUtils, itemUtils, Logging, queryUtils, workflowUtils} from '../../../proxy.mjs';
function hasCR(actor) {
    return actor?.type === 'npc' && actor.system.details.cr > 0;
}
async function betBig(item, token) {
    if (item.actor.system.attributes.inspiration) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'bet-big');
    if (!activity) return Logging.addMacroWarning('CPR', 'fate-gambler', 'Missing the bet-big activity.', {notify: 'warn'});
    await workflowUtils.completeActivityUse(activity, token ? [token] : []);
}
async function rollFinished({document: item, workflow}) {
    if (workflow.actor.system.attributes.inspiration) return;
    const killed = workflow.damageList?.some(entry => entry.oldHP > 0 && entry.newHP === 0 && hasCR(fromUuidSync(entry.actorUuid)));
    const saved = workflow.saveResults?.length && (workflow.failedSaves?.documents ?? []).some(token => hasCR(token.actor));
    if (!killed && !saved) return;
    await betBig(item, workflow.token?.document);
}
async function check({document: item, actor, roll, token}) {
    if (actor.system.attributes.inspiration || roll.isFailure) return;
    if (!await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Modern.FateGambler.Check', {userId: queryUtils.firstOwner(actor, true)})) return;
    await betBig(item, token);
}
async function preTargeting({activity}) {
    if (documentUtils.getIdentifier(activity) !== 'win-big' || activity.actor.system.attributes.inspiration) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.FateGambler.NoInspiration', {type: 'warn'});
    return true;
}
async function winBig({workflow}) {
    if (documentUtils.getIdentifier(workflow.activity) !== 'win-big') return;
    await documentUtils.update(workflow.actor, {'system.attributes.inspiration': false});
}
export const fateGambler = {
    name: 'Fate Gambler',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: preTargeting,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: winBig,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: rollFinished,
            priority: 250
        }
    ],
    check: [
        {
            pass: 'actorPost',
            macro: check,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'actorPost',
            macro: check,
            priority: 50
        }
    ],
    tool: [
        {
            pass: 'actorPost',
            macro: check,
            priority: 50
        }
    ]
};
