import {actorUtils, effectUtils, itemUtils} from '../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'autoProne');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    for (let token of workflow.hitTargets) {
        if (config.checkSaves && !workflow.failedSaves.has(token)) continue;
        let sizeLimit = Number(config.sizeLimit);
        if (sizeLimit != -1 && actorUtils.getSize(token.actor) > sizeLimit) continue; 
        await effectUtils.applyConditions(token.actor, ['prone']);
    }
}
export let autoProne = {
    name: 'Auto Prone',
    translation: 'CHRISPREMADES.Macros.AutoProne.Name',
    version: '1.3.132',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
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
            value: 'sizeLimit',
            label: 'CHRISPREMADES.Config.SizeLimit',
            type: 'select',
            default: -1,
            options: () => {return [{value: '-1', label: 'CHRISPREMADES.Generic.None'}, ...Object.values(CONFIG.DND5E.actorSizes).map(data => ({value: String(data.numerical), label: data.label}))];}
        },
        {
            value: 'checkSaves',
            label: 'CHRISPREMADES.Config.CheckSaves',
            type: 'checkbox',
            default: true
        }
    ]
};