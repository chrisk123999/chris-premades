import {activityUtils, automationUtils, dialogUtils, documentUtils, itemUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const familiarities = {
    2014: ['PermanentCircle', 'AssociatedObject', 'VeryFamiliar', 'SeenCasually', 'ViewedOnce', 'Description', 'FalseDestination'],
    2024: ['PermanentCircle', 'LinkedObject', 'VeryFamiliar', 'SeenCasually', 'ViewedOnceDescribed', 'FalseDestination']
};
const outcomeTable = {
    VeryFamiliar: [6, 14, 25],
    SeenCasually: [34, 44, 54],
    ViewedOnce: [44, 54, 74],
    Description: [44, 54, 74],
    ViewedOnceDescribed: [44, 54, 74],
    FalseDestination: [51, 101, 101]
};
const directions = {
    2014: ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'],
    2024: ['East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest', 'North', 'Northeast']
};
function getOutcome(familiarity, total) {
    const thresholds = outcomeTable[familiarity];
    if (!thresholds) return 'OnTarget';
    if (total < thresholds[0]) return 'Mishap';
    if (total < thresholds[1]) return 'SimilarArea';
    if (total < thresholds[2]) return 'OffTarget';
    return 'OnTarget';
}
async function blindRoll(formula, flavor, speaker) {
    return (await rollUtils.rollDice(formula, {message: true, flavor: _loc(flavor), speaker, mode: 'blind'})).roll;
}
async function offTarget(item, rules, speaker, userId) {
    const distanceRoll = await blindRoll(rules === '2014' ? '1d10 * 1d10' : '2d12', 'CHRISPREMADES.Macros.All.Teleport.Distance', speaker);
    const directionRoll = await blindRoll('1d8', 'CHRISPREMADES.Macros.All.Teleport.Direction', speaker);
    let distance = distanceRoll.total;
    let units = 'Miles';
    if (rules === '2014') {
        const travel = await dialogUtils.numberDialog(item.name, 'CHRISPREMADES.Macros.All.Teleport.HowFar', {label: 'CHRISPREMADES.Macros.All.Teleport.TravelDistance', name: 'distance', options: {}}, {userId});
        if (!travel) return;
        units = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.All.Teleport.Units', [['CHRISPREMADES.Macros.All.Teleport.Miles', 'Miles'], ['CHRISPREMADES.Macros.All.Teleport.Feet', 'Feet']], {userId}) ?? 'Miles';
        distance = Math.floor(distanceRoll.total / 100 * travel);
    }
    await ChatMessage.create({
        speaker,
        content: _loc('CHRISPREMADES.Macros.All.Teleport.OffTargetString', {distance, units: _loc('CHRISPREMADES.Macros.All.Teleport.' + units).toLowerCase(), direction: _loc('CHRISPREMADES.Macros.All.Teleport.Directions.' + directions[rules][directionRoll.total - 1])}),
        whisper: [userId],
        blind: true
    });
}
async function use({workflow}) {
    if (workflow.activity.identifier !== 'teleport') return;
    const item = workflow.item;
    const token = workflow.token.document;
    const rules = documentUtils.getRules(item) === '2024' ? '2024' : '2014';
    const userId = queryUtils.gmID();
    let followers = [];
    const nearby = tokenUtils.findNearby(token, 10, {disposition: 'ally'});
    if (nearby.length) {
        const selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.All.Teleport.Select', nearby, {type: 'multiple', maxAmount: 8, skipDeadAndUnconscious: false});
        followers = selection?.result ?? [];
    }
    const familiarity = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.All.Teleport.Familiarity', familiarities[rules].map(key => ['CHRISPREMADES.Macros.All.Teleport.' + key, key]), {userId});
    if (!familiarity) return;
    const speaker = ChatMessage.getSpeaker({token});
    let outcome;
    let mishaps = 0;
    do {
        const roll = await rollUtils.rollDice('1d100');
        outcome = getOutcome(familiarity, roll.total);
        await roll.toMessage({speaker, flavor: _loc('CHRISPREMADES.Macros.All.Teleport.' + outcome)}, {messageMode: 'blind'});
        if (outcome === 'Mishap') mishaps++;
    } while (outcome === 'Mishap');
    const damage = itemUtils.getActivityByIdentifier(item, 'teleport-damage');
    if (mishaps && damage) await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(damage, (mishaps * 3) + 'd10', {types: ['force']}), item, [token, ...followers]);
    if (outcome === 'OffTarget') await offTarget(item, rules, speaker, userId);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    const range = canvas.dimensions.distance * Math.ceil(Math.max(canvas.dimensions.width, canvas.dimensions.height) / canvas.dimensions.size);
    await tokenUtils.teleportToken(token, {animation, options, range, followers, followerRange: range, requireSight: false, ignoreWalls: true, userId});
}
export const teleport = {
    name: 'Teleport',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'teleportSpell'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
export const teleportModern = {...teleport, rules: '2024'};
