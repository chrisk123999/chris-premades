import {actorUtils, dialogUtils, itemUtils, Logging, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function offer(item, token, message) {
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'pack-hunter');
    if (!activity) return Logging.addMacroWarning('CPR', 'pack-hunter', 'Pack Hunter activity is missing.', {notify: 'warn'});
    if (!await dialogUtils.confirm(item.name, _loc(message, {name: token.name}), {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.syntheticActivityRoll(activity, [token.document ?? token]);
    return true;
}
async function attack({document: item, actor, token, workflow}) {
    if (item.actor === actor || !workflow.activity?.hasAttack) return;
    if (workflowUtils.getWorkflowProperty(workflow, 'packHunter')) return;
    if (!await offer(item, token, 'CHRISPREMADES.Macros.Modern.PackHunter.Attack')) return;
    workflowUtils.setWorkflowProperty(workflow, 'packHunter', true);
    workflow.tracker.advantage.add('pack-hunter', item.name);
}
async function save({document: item, actor, token, options}) {
    if (item.actor === actor || options.advantage) return;
    if (!await offer(item, token, 'CHRISPREMADES.Macros.Modern.PackHunter.Save')) return;
    options.advantage = true;
}
const nearby = {configDistance: 'distance', dispositions: ['ally'], disabled: ['incapacitated'], canOverlap: true};
export const packHunter = {
    name: 'Pack Hunter',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'nearbyAttackRollConfig',
            macro: attack,
            priority: 600,
            ...nearby
        }
    ],
    save: [
        {
            pass: 'nearbySituational',
            macro: save,
            priority: 600,
            ...nearby
        }
    ],
    config: {
        distance: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        }
    }
};
