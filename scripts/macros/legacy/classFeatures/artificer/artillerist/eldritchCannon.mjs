import {actorUtils, automationUtils, dialogUtils, documentUtils, genericUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function abort(workflow, message, format) {
    genericUtils.notify(message, {type: 'warn', format});
    workflow.aborted = true;
    return true;
}
async function create({document: item, workflow}) {
    if (!['create', 'create-slot'].includes(workflow.activity.identifier)) return;
    const max = actorUtils.getItemByIdentifier(workflow.actor, 'fortified-position') ? 2 : 1;
    if (summonUtils.getSummonsBySource(item).length >= max) return abort(workflow, 'CHRISPREMADES.Macros.Legacy.EldritchCannon.Limit', {max});
}
async function second({document: item, workflow}) {
    if (workflow.activity.identifier !== 'create' || workflowUtils.getWorkflowProperty(workflow, 'eldritchCannonSecond')) return;
    if (!actorUtils.getItemByIdentifier(workflow.actor, 'fortified-position') || !item.system.uses.value || summonUtils.getSummonsBySource(item).length !== 1) return;
    if (!await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Legacy.EldritchCannon.Second', {userId: queryUtils.firstOwner(workflow.actor, true)})) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'eldritchCannonSecond', true);
    const live = workflow.actor.items.get(item.id);
    await documentUtils.update(live, {'system.uses.spent': live.system.uses.spent + 1});
    await workflowUtils.completeActivityUse(workflow.activity, [], {options, consumeResources: []});
}
async function activate({workflow}) {
    const summon = summonUtils.getSummonData(workflow.actor);
    const ownerToken = summon?.owner ? actorUtils.getFirstToken(summon.owner) : undefined;
    if (!ownerToken || !workflow.token || !summon.sourceItem) return;
    const distance = automationUtils.getConfigValue(summon.sourceItem, 'commandRange');
    if (tokenUtils.isWithinDistance(ownerToken, workflow.token.document, distance)) return;
    return abort(workflow, 'CHRISPREMADES.Macros.Legacy.EldritchCannon.TooFar', {distance});
}
export const createEldritchCannon = {
    name: 'Create Eldritch Cannon',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: create,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: second,
            priority: 50
        }
    ],
    config: {
        commandRange: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.EldritchCannon.CommandRange',
            category: 'homebrew'
        }
    }
};
export const eldritchCannonActivation = {
    name: 'Eldritch Cannon',
    version: createEldritchCannon.version,
    rules: '2014',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: activate,
            priority: 50
        }
    ]
};
