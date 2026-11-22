import {actorUtils, automationUtils, constants, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function redirect({document: item, workflow, sourceToken, token: attackerToken}) {
    if (!attackerToken || !sourceToken.object || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (actorUtils.hasUsedReaction(sourceToken.actor)) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'redirectAttack', configKeys);
    if (config.requireCover && !tokenUtils.checkCover(attackerToken, sourceToken, {activity: workflow.activity})) return;
    const candidates = tokenUtils.findNearby(sourceToken, config.range, {disposition: config.disposition}).filter(t => {
        if (t.id === attackerToken.id || !t.actor) return false;
        return !config.sizes.length || config.sizes.includes(actorUtils.getSize(t.actor, true));
    });
    if (!candidates.length) return;
    const newTarget = (await dialogUtils.selectTargetDialog(
        item.name,
        _loc('CHRISPREMADES.Macros.Generic.RedirectAttack.Select', {item: item.name, attack: workflow.item.name}),
        candidates,
        {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(sourceToken, true)}
    ))?.result;
    if (!newTarget) return;
    const activity = item.system.activities.get(config.activityId);
    const used = activity ? await workflowUtils.completeActivityUse(activity, [sourceToken]) : await workflowUtils.completeItemUse(item, [sourceToken]);
    if (!used) return;
    if (config.swapPlaces) await tokenUtils.swapTokens(sourceToken, newTarget);
    const targets = workflow.targets.documents.filter(t => t.id !== sourceToken.id);
    await workflowUtils.updateTargets(workflow, [...targets, newTarget]);
}
/**
 * Offers to redirect an attack against the item's owner to another nearby creature by using the item. Nothing is offered
 * once the owner's reaction is spent.
 */
export const redirectAttack = {
    rules: 'all',
    version: '2.1.11',
    category: 'targeting',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'targetTargeting',
            macro: redirect,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.Activity.Hint'
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.Range.Hint'
        },
        disposition: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Disposition',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.Disposition.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Generic.Common.All'}, ...constants.dispositionOptions]; }
        },
        sizes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SizeLimit',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.Sizes.Hint',
            get options() { return constants.sizeOptions; }
        },
        swapPlaces: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RedirectAttack.SwapPlaces.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.SwapPlaces.Hint'
        },
        requireCover: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RedirectAttack.RequireCover.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.RequireCover.Hint'
        }
    }
};
const configKeys = Object.keys(redirectAttack.genericConfig);
