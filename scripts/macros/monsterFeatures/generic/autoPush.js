import {itemUtils, genericUtils, tokenUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'autoPush');
    if (isNaN(Number(config.distance))) return;
    workflow.targets.forEach(token => {
        if (config.failed && !workflow.failedSaves.has(token)) return;
        let distance = Number(config.distance);
        if (distance < 0) {
            let distanceBetween = tokenUtils.getDistance(workflow.token, token, {wallsBlock: true, checkCover: genericUtils.getCPRSetting('movementPerformance') === 3});
            distance = Math.max(distance, -distanceBetween);
        }
        tokenUtils.pushToken(workflow.token, token, distance);
    });
}
export let autoPush = {
    name: 'Auto Push',
    translation: 'CHRISPREMADES.Macros.AutoPush.Name',
    version: '1.0.50',
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
            value: 'distance',
            label: 'CHRISPREMADES.Config.Distance',
            type: 'text',
            default: 10
        },
        {
            value: 'failed',
            label: 'CHRISPREMADES.Config.FailedSave',
            type: 'checkbox',
            default: true
        }
    ]
};