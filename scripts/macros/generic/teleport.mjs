import {actorUtils, automationUtils, dialogUtils, documentUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {resolveCastFormula} from './multiSingleTarget.mjs';
async function pickCompanions({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    if (!workflow.token || config.targets !== 'self') return;
    if (config.excludeUser && workflow.targets.has(workflow.token)) await workflowUtils.removeTargets(workflow, [workflow.token]);
    const max = Number(config.companions) || 0;
    if (!max) return;
    let companions = workflowUtils.getWorkflowProperty(workflow, 'chris-premades.teleportCompanions')?.map(t => {
        if (typeof t === 'string') {
            const token = workflow.token.scene.tokens.get(t);
            if (token) return token;
        }
        if (t instanceof TokenDocument.implementation) return t;
    }).filter(Boolean);
    if (!companions?.length || companions.length > max) {
        const casterSize = actorUtils.getSize(workflow.actor);
        const nearby = tokenUtils.findNearby(workflow.token.document, config.companionRange, {disposition: 'ally'}).filter(token => !config.companionMaxSize || actorUtils.getSize(token.actor) <= casterSize);
        if (!nearby.length) return;
        const preselected = nearby.reduce((obj, each) => (obj[each.id] = obj.count++ < max, obj), {count: 0});
        const selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Generic.Teleport.SelectCompanions', nearby, {
            userId: queryUtils.firstOwner(workflow.actor, true),
            skipDeadAndUnconscious: false,
            type: 'multiple',
            maxAmount: max,
            preselected
        });
        companions = selection?.result ?? [];
    }
    if (!companions.length) return;
    workflowUtils.setWorkflowProperty(workflow, 'chris-premades.teleportCompanions', companions);
    await workflowUtils.removeTargets(workflow, companions.map(token => token.object));
}
async function use({document, workflow}) {
    if (!workflow.token) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'No token on the scene.');
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const rolledRange = config.rangeFromRoll ? workflow.utilityRolls?.[0]?.total : undefined;
    const configRange = config.range ? rollUtils.rollDiceSync(resolveCastFormula(String(config.range), workflow.castData), {document: workflow.activity}).total : undefined;
    const range = rolledRange || configRange || workflow.activity.range.value;
    if (config.targets === 'nearTarget') {
        const targets = Array.from(workflow.targets, token => token.document).filter(token => token !== workflow.token.document);
        const selection = targets.length > 1 ? await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Generic.Teleport.SelectNear', targets, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)}) : {result: targets[0]};
        const target = selection?.result;
        if (target) await tokenUtils.teleportToken(workflow.token.document, {animation, options, range, requireSight: config.requireSight, centerpoint: target.object.center});
        return;
    }
    if (config.targets === 'swap') {
        const target = workflow.failedSaves.first()?.document;
        if (target) await tokenUtils.swapTokens(workflow.token.document, target, {animation, options});
        return;
    }
    if (config.targets !== 'failedSaves') {
        const followers = workflowUtils.getWorkflowProperty(workflow, 'chris-premades.teleportCompanions') ?? [];
        await tokenUtils.teleportToken(workflow.token.document, {animation, options, range, requireSight: config.requireSight, followers});
        return;
    }
    for (const target of workflow.failedSaves) {
        await tokenUtils.teleportToken(target.document, {animation, options, range, requireSight: config.requireSight, centerpoint: workflow.token.center});
    }
}
/**
 * Teleports the user, or each target that failed its save, once the roll finishes.
 * Bound on an activity. Fires on `activityRollFinished`.
 * Provide preselected targets by setting the workflow property `chris-premades.teleportCompanions` to an array of token ids or token documents.
 *
 * Config:
 * - `targets`: teleport the user, each target that failed its save, or the user to a space near one of the targets. The user picks every destination. `swap` trades places with the first target that failed its save.
 * - `range`: maximum teleport distance formula. `@item.level` and `@scaling` use the cast level and upcast levels. Leave blank to use the activity's own range.
 * - `rangeFromRoll`: use the activity's utility roll total as the maximum distance. Falls back to `range`.
 * - `requireSight`: only allow spaces the user can see. Turn off for teleports that need no sight.
 * - `companions`: how many allies within `companionRange` the user may bring along. They keep their position relative to the user and are dropped from the activity's targets.
 * - `companionMaxSize`: only offer companions no larger than the user.
 * - `excludeUser`: drop the user from the activity's targets on a self teleport, for areas centred on the space the user leaves.
 * - `animation`: played during the teleport.
 */
export const teleport = {
    rules: 'all',
    version: '2.1.3',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: pickCompanions,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        targets: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.Targets',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.TargetsHint',
            options: [
                {value: 'self', label: 'CHRISPREMADES.Macros.Generic.Teleport.Self'},
                {value: 'failedSaves', label: 'CHRISPREMADES.Macros.Generic.Teleport.FailedSaves'},
                {value: 'nearTarget', label: 'CHRISPREMADES.Macros.Generic.Teleport.NearTarget'},
                {value: 'swap', label: 'CHRISPREMADES.Macros.Generic.Teleport.Swap'}
            ]
        },
        range: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeHint'
        },
        rangeFromRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRoll',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRollHint'
        },
        requireSight: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSight',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSightHint'
        },
        companions: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.Companions',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionsHint'
        },
        companionRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionRange'
        },
        companionMaxSize: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionMaxSize'
        },
        excludeUser: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.ExcludeUser',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.ExcludeUserHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
const configKeys = Object.keys(teleport.genericConfig);
