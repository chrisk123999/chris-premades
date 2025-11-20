import {actorUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function late({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'autoGrapple');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    for (let token of workflow.hitTargets) {
        let sizeLimit = Number(config.sizeLimit);
        if (sizeLimit != -1 && actorUtils.getSize(token.actor) > sizeLimit) continue; 
        await tokenUtils.grappleHelper(workflow.token, token, item, {noContest: true, flatDC: config.dc, escapeDisadvantage: config.disadvantage, restrained: config.restrained, ignoreSizeLimit: config.ignoreLimit});
    }
}
export let autoGrapple = {
    name: 'Auto Grapple',
    translation: 'CHRISPREMADES.Macros.AutoGrapple.Name',
    version: '0.12.83',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'dc',
            label: 'CHRISPREMADES.Macros.AutoGrapple.DC',
            type: 'number',
            default: 13
        },
        {
            value: 'disadvantage',
            label: 'CHRISPREMADES.Macros.AutoGrapple.Disadvantage',
            type: 'checkbox',
            default: false
        },
        {
            value: 'restrained',
            label: 'CHRISPREMADES.Macros.AutoGrapple.Restrained',
            type: 'checkbox',
            default: false
        },
        {
            value: 'ignoreLimit',
            label: 'CHRISPREMADES.Macros.AutoGrapple.IgnoreLimit',
            type: 'checkbox',
            default: false
        },
        {
            value: 'sizeLimit',
            label: 'CHRISPREMADES.Config.SizeLimit',
            type: 'select',
            default: -1,
            options: () => {return [{value: '-1', label: 'CHRISPREMADES.Generic.None'}, ...Object.values(CONFIG.DND5E.actorSizes).map(data => ({value: String(data.numerical), label: data.label}))];}
        }
    ]
};