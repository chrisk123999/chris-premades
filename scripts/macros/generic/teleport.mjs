import {activityUtils, actorUtils, automationUtils, dialogUtils, distanceUtils, documentUtils, genericUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {resolveCastFormula} from './multiSingleTarget.mjs';
async function pickCompanions({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    if (!workflow.token || config.targets !== 'self') return;
    if (config.excludeUser && workflow.targets.has(workflow.token)) await workflowUtils.removeTargets(workflow, [workflow.tokenDocument]);
    const max = Number(config.companions) || 0;
    if (!max) return;
    let companions = getCompanions(workflow);
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
    workflowUtils.setWorkflowProperty(workflow, 'chris-premades.teleportCompanions', companions.map(token => token.id));
    await workflowUtils.removeTargets(workflow, companions);
}
function getCompanions(workflow) {
    return workflowUtils.getWorkflowProperty(workflow, 'chris-premades.teleportCompanions')?.map(id => workflow.token.scene.tokens.get(id)).filter(Boolean);
}
function getSpacesNear(token, target, range) {
    const {size} = token.parent.grid;
    const width = token.width * size;
    const height = token.height * size;
    const reach = (Math.max(1, Math.round(distanceUtils.toGridSpaces(token.parent, range))) - 1) * size;
    const bounds = target.object.bounds;
    const occupied = canvas.tokens.placeables.filter(other => other.document !== token).map(other => other.bounds);
    const points = [];
    for (let x = bounds.left - width - reach; x <= bounds.right + reach; x += size) {
        for (let y = bounds.top - height - reach; y <= bounds.bottom + reach; y += size) {
            const area = new PIXI.Rectangle(x + 1, y + 1, width - 2, height - 2);
            if (!occupied.some(other => other.intersects(area))) points.push(token.getCenterPoint({x, y}));
        }
    }
    return points;
}
async function use({document, workflow}) {
    if (workflow.workflowOptions?.rollAttackPerTarget) return;
    if (!workflow.token) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'No token on the scene.');
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const rolledRange = config.rangeFromRoll ? workflow.utilityRolls?.[0]?.total : undefined;
    const configRange = config.range ? rollUtils.rollDiceSync(resolveCastFormula(String(config.range), workflow.castData), {document: workflow.activity}).total : undefined;
    const range = rolledRange || configRange || activityUtils.getRange(workflow.activity);
    if (config.targets === 'nearTarget') {
        const targets = workflow.targets.tokens.map(token => token.document).filter(token => token !== workflow.token.document);
        const selection = targets.length > 1 ? await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Generic.Teleport.SelectNear', targets, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)}) : {result: targets[0]};
        const target = selection?.result;
        if (target) await tokenUtils.teleportToken(workflow.token.document, {animation, options, range: range + distanceUtils.fromGridSpaces(workflow.token.scene, (target.width + workflow.token.document.width) / 2), requireSight: config.requireSight, centerpoint: target.object.center, allowedPoints: getSpacesNear(workflow.token.document, target, range)});
        return;
    }
    if (config.targets === 'swap') {
        const target = workflow.failedSaves.tokens[0]?.document;
        if (target) await tokenUtils.swapTokens(workflow.token.document, target, {animation, options});
        return;
    }
    if (config.targets === 'targets') {
        for (const target of workflow.targets.documents) await tokenUtils.teleportToken(target, {animation, options, range, requireSight: config.requireSight, centerpoint: target.object?.center, sightToken: workflow.token.document});
        return;
    }
    if (config.targets !== 'failedSaves') {
        const followers = getCompanions(workflow) ?? [];
        const token = workflow.token.document;
        const current = token.getCenterPoint();
        const allowedPoints = config.visitedThisTurn ? token.movementHistory.map(point => token.getCenterPoint(point)).filter(point => point.x !== current.x || point.y !== current.y) : undefined;
        if (allowedPoints && !allowedPoints.length) return genericUtils.notify('CHRISPREMADES.Macros.Generic.Teleport.NoVisited', {type: 'warn'});
        const placement = Number(config.companionPlacement) || 0;
        await tokenUtils.teleportToken(token, {animation, options, range, requireSight: config.requireSight, followers: placement ? [] : followers, allowedPoints});
        if (!placement) return;
        const userId = queryUtils.firstOwner(workflow.actor, true);
        for (const follower of followers) await tokenUtils.teleportToken(follower, {animation, options, range: placement, requireSight: config.requireSight, centerpoint: token.getCenterPoint(), sightToken: token, userId});
        return;
    }
    for (const target of workflow.failedSaves.tokens) {
        await tokenUtils.teleportToken(target.document, {animation, options, range, requireSight: config.requireSight, centerpoint: workflow.token.center});
    }
}
/**
 * Teleports the user, every target or the targets that failed their save once the activity's roll finishes, or swaps the user with
 * a target. The user picks every destination. Set the workflow property `chris-premades.teleportCompanions` to an
 * array of token ids to preselect companions.
 */
export const teleport = {
    rules: 'all',
    version: '2.1.11',
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
            label: 'CHRISPREMADES.Macros.Generic.Teleport.Targets.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.Targets.Hint',
            options: [
                {value: 'self', label: 'CHRISPREMADES.Macros.Generic.Teleport.Self'},
                {value: 'failedSaves', label: 'CHRISPREMADES.Macros.Generic.Teleport.FailedSaves'},
                {value: 'targets', label: 'CHRISPREMADES.Macros.Generic.Teleport.EachTarget'},
                {value: 'nearTarget', label: 'CHRISPREMADES.Macros.Generic.Teleport.NearTarget'},
                {value: 'swap', label: 'CHRISPREMADES.Macros.Generic.Teleport.Swap'}
            ]
        },
        range: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.Range.Hint'
        },
        rangeFromRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRoll.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRoll.Hint'
        },
        requireSight: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSight.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSight.Hint'
        },
        companions: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.Companions.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.Companions.Hint'
        },
        companionRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionRange.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionRange.Hint'
        },
        companionPlacement: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionPlacement.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionPlacement.Hint'
        },
        companionMaxSize: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionMaxSize.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.CompanionMaxSize.Hint'
        },
        visitedThisTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.VisitedThisTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.VisitedThisTurn.Hint'
        },
        excludeUser: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.ExcludeUser.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.ExcludeUser.Hint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.Animation.Hint'
        }
    }
};
const configKeys = Object.keys(teleport.genericConfig);
