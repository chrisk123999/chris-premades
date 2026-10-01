import {actorUtils, automationUtils, constants, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function redirect({document: item, workflow, sourceToken, token: attackerToken}) {
    if (!attackerToken || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (actorUtils.hasUsedReaction(sourceToken.actor)) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'redirectAttack', configKeys);
    if (config.requireCover && !tokenUtils.checkCover(attackerToken, sourceToken, {activity: workflow.activity})) return;
    const candidates = tokenUtils.findNearby(sourceToken, config.range, {disposition: config.disposition}).filter(t => {
        if (t.id === attackerToken.id) return false;
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
    const targets = Array.from(workflow.targets, t => t.document ?? t).filter(t => t.id !== sourceToken.id);
    await workflowUtils.updateTargets(workflow, [...targets, newTarget]);
}
export const redirectAttack = {
    rules: 'all',
    version: '2.0.0',
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
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.ActivityHint'
        },
        range: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.RangeHint'
        },
        disposition: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Disposition',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.DispositionHint',
            get options() { return [{value: '', label: _loc('CHRISPREMADES.Config.All')}, ...constants.dispositionOptions()]; }
        },
        sizes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SizeLimit',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.SizesHint',
            get options() { return constants.sizeOptions(); }
        },
        swapPlaces: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RedirectAttack.SwapPlaces',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.SwapPlacesHint'
        },
        requireCover: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RedirectAttack.RequireCover',
            hint: 'CHRISPREMADES.Macros.Generic.RedirectAttack.RequireCoverHint'
        }
    }
};
const configKeys = Object.keys(redirectAttack.genericConfig);
