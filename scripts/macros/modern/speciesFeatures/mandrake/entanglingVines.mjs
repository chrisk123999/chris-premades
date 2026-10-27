import {actorUtils, automationUtils, constants, dialogUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
const seasons = ['spring', 'summer', 'autumn', 'winter'];
function getSeason(item) {
    const actor = item.actor;
    if (actor.type === 'character' && actor.system.details.level < automationUtils.getConfigValue(item, 'seasonLevel')) return;
    return automationUtils.getConfigValue(item, 'season');
}
function heightAboveFloor(token) {
    return token.elevation - tokenUtils.floorBelow(token).elevation;
}
function getLimits(item, scene) {
    const {maxSize, springHeight} = automationUtils.getConfigValues(item, ['maxSize', 'springHeight']);
    return {maxSize: CONFIG.DND5E.actorSizes[maxSize]?.numerical ?? Infinity, springHeight: genericUtils.convertDistance(scene, springHeight)};
}
function canTarget(limits, token, season) {
    if (actorUtils.getSize(token.actor) > limits.maxSize) return 'CHRISPREMADES.Macros.Modern.EntanglingVines.TooLarge';
    const height = heightAboveFloor(token);
    if (height <= 0) return;
    if (season !== 'spring' || height > limits.springHeight) return 'CHRISPREMADES.Macros.Modern.EntanglingVines.Airborne';
}
async function early({document: item, workflow}) {
    if (workflow.activity.identifier !== 'entangling-vines') return;
    const target = workflow.targets.first()?.document;
    if (!target?.actor) return;
    const reason = canTarget(getLimits(item, target.parent), target, getSeason(item));
    if (!reason) return;
    Logging.addMacroWarning('CPR', 'entangling-vines', reason, {notify: 'info', format: {name: target.name}});
    return true;
}
async function targeting({document: item, workflow}) {
    if (workflow.activity.identifier !== 'entangling-vines' || getSeason(item) !== 'autumn') return;
    const first = workflow.targets.first();
    if (!first?.actor) return;
    const range = genericUtils.convertDistance(first.document.parent, automationUtils.getConfigValue(item, 'autumnRange'));
    const limits = getLimits(item, first.document.parent);
    const nearby = tokenUtils.findNearby(first.document, range).filter(token => token.actor && token !== workflow.token.document && !canTarget(limits, token, 'autumn'));
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Modern.EntanglingVines.SecondTarget', nearby, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(item.actor, true)});
    const second = selection?.result;
    if (!second) return;
    await workflowUtils.updateTargets(workflow, [first, second.object ?? second]);
}
async function finished({document: item, workflow}) {
    if (workflow.activity.identifier !== 'entangling-vines' || !workflow.token) return;
    const season = getSeason(item);
    const targets = Array.from(workflow.targets).map(token => token.document).filter(token => token.actor);
    if (!season || !targets.length) return;
    if (season === 'spring') {
        await Promise.all(targets.map(token => {
            const floor = tokenUtils.floorBelow(token);
            if (token.elevation <= floor.elevation) return;
            return tokenUtils.displaceToken(token, {sourceToken: workflow.token.document, destination: {x: token.x, y: token.y}, elevation: floor.elevation, level: floor.level});
        }));
    } else if (season === 'summer') {
        const range = genericUtils.convertDistance(workflow.token.document.parent, automationUtils.getConfigValue(item, 'summerDistance'));
        for (const token of targets) await tokenUtils.displaceToken(token, {sourceToken: workflow.token.document, range});
    } else if (season === 'winter') {
        const activity = itemUtils.getActivityByIdentifier(item, 'winter');
        if (!activity) return Logging.addMacroWarning('CPR', 'entangling-vines', 'Winter activity missing from item.', {notify: 'warn'});
        await workflowUtils.syntheticActivityRoll(activity, targets, {consumeUsage: false, consumeResources: false});
    }
}
async function added({document: item}) {
    if (automationUtils.getConfigValue(item, 'season')) return;
    const buttons = seasons.map(season => [_loc('CHRISPREMADES.Macros.Modern.EntanglingVines.Seasons.' + season), season]);
    const season = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.EntanglingVines.SelectSeason', buttons, {userId: queryUtils.firstOwner(item.actor, true)});
    if (season) await automationUtils.setConfigValue(item, 'season', season);
}
export const entanglingVines = {
    name: 'Entangling Vines',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemTargeting',
            macro: targeting,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: finished,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'munched',
            macro: added,
            priority: 50
        }
    ],
    config: {
        season: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.Season',
            hint: 'CHRISPREMADES.Macros.Modern.EntanglingVines.SeasonHint',
            category: 'mechanics',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.Ask'}, ...seasons.map(season => ({value: season, label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.Seasons.' + season}))]; }
        },
        seasonLevel: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.SeasonLevel',
            category: 'homebrew'
        },
        maxSize: {
            default: 'lg',
            type: 'select',
            label: 'CHRISPREMADES.Config.MaxSize',
            category: 'homebrew',
            get options() { return constants.sizeOptions; }
        },
        springHeight: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.SpringHeight',
            category: 'homebrew'
        },
        summerDistance: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.SummerDistance',
            category: 'homebrew'
        },
        autumnRange: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.EntanglingVines.AutumnRange',
            category: 'homebrew'
        }
    }
};
