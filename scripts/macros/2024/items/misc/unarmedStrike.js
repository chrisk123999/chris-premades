import {activityUtils, actorUtils, dialogUtils, effectUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function grapple({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let size = actorUtils.getSize(workflow.actor, false);
    let dexTargets = [];
    let strTargets = [];
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.getSize(token.actor, false) > (size + 1)) return;
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.UnarmedStrike.GrappleContest', [['DND5E.AbilityStr', 'str'], ['DND5E.AbilityDex', 'dex']], {displayAsRows: true, userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection || selection === 'dex') {
            dexTargets.push(token);
        } else {
            strTargets.push(token);
        }
    }));
    if (dexTargets.length) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'dexSave', {strict: true});
        if (activity) {
            let results = await workflowUtils.syntheticActivityRoll(activity, dexTargets);
            await Promise.all(results.failedSaves.map(async token => await tokenUtils.grappleHelper(workflow.token, token, workflow.item, {noContest: true, flatDC: activity.save.dc.value})));
        }
    }
    if (strTargets.length) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'strSave', {strict: true});
        if (activity) {
            let results = await workflowUtils.syntheticActivityRoll(activity, strTargets);
            await Promise.all(results.failedSaves.map(async token => await tokenUtils.grappleHelper(workflow.token, token, workflow.item, {noContest: true, flatDC: activity.save.dc.value})));
        }
    }
}
async function shove({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let size = actorUtils.getSize(workflow.actor, false);
    let dexTargets = [];
    let strTargets = [];
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.getSize(token.actor, false) > (size + 1)) return;
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.UnarmedStrike.ShoveContest', [['DND5E.AbilityStr', 'str'], ['DND5E.AbilityDex', 'dex']], {displayAsRows: true, userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection || selection === 'dex') {
            dexTargets.push(token);
        } else {
            strTargets.push(token);
        }
    }));
    let identifier = activityUtils.getIdentifier(workflow.activity);
    if (dexTargets.length) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'dexSave', {strict: true});
        if (activity) {
            let results = await workflowUtils.syntheticActivityRoll(activity, dexTargets);
            if (identifier === 'shoveProne') {
                await Promise.all(results.failedSaves.map(async token => await effectUtils.applyConditions(token.actor, ['prone'])));
            } else {
                await Promise.all(results.failedSaves.map(async token => await tokenUtils.pushToken(workflow.token, token, 5)));
            }
        }
    }
    if (strTargets.length) {
        let activity = activityUtils.getActivityByIdentifier(workflow.item, 'strSave', {strict: true});
        if (activity) {
            let results = await workflowUtils.syntheticActivityRoll(activity, strTargets);
            if (identifier === 'shoveProne') {
                await Promise.all(results.failedSaves.map(async token => await effectUtils.applyConditions(token.actor, ['prone'])));
            } else {
                await Promise.all(results.failedSaves.map(async token => await tokenUtils.pushToken(workflow.token, token, 5)));
            }
        }
    }
}
export let unarmedStrike = {
    name: 'Unarmed Strike',
    version: '1.1.36',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: grapple,
                priority: 50,
                activities: ['grapple']
            },
            
            {
                pass: 'rollFinished',
                macro: shove,
                priority: 50,
                activities: ['shoveProne', 'shovePush']
            }
        ]
    }
};