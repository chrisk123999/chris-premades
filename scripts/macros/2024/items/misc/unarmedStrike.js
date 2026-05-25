import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function sizeCheck({workflow}) {
    let heavy = !!itemUtils.getItemByIdentifier(workflow.actor, 'heavyweight');
    let size = actorUtils.getSize(workflow.actor, false) + heavy;
    let id = activityUtils.getIdentifier(workflow.activity);
    for (let t of workflow.targets) {
        if (actorUtils.getSize(t.actor, false) <= (size + 1)) continue;
        let warning = id === 'grapple' ? 'Grapple.Size' : 'Shove.Big';
        genericUtils.notify('CHRISPREMADES.Macros.' + warning, 'info');
        workflow.aborted = true;
        return true;
    }
}
async function grapple({workflow}) {
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async token => await tokenUtils.grappleHelper(workflow.token, token, workflow.item, {noContest: true, flatDC: workflow.activity.save.dc.value})));
}
async function shove({workflow}) {
    if (!workflow.failedSaves.size) return;
    switch(activityUtils.getIdentifier(workflow.activity)) {
        case 'shoveProne':
            await Promise.all(workflow.failedSaves.map(async token => await effectUtils.applyConditions(token.actor, ['prone'])));
            break;
        case 'shovePush':
            await Promise.all(workflow.failedSaves.map(async token => await tokenUtils.pushToken(workflow.token, token, 5)));
            break;
    }
}
export let unarmedStrike = {
    name: 'Unarmed Strike',
    version: '1.5.34',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: sizeCheck,
                priority: 50,
                activities: ['grapple', 'shoveProne', 'shovePush']
            },
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