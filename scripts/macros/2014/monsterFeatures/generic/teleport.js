import {Teleport} from '../../../../lib/teleport.js';
import {itemUtils} from '../../../../utils.js';
import {teleportEffects} from '../../../animations/teleportEffects.js';
async function late({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'genericTeleport');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    await Teleport.target([workflow.token], workflow.token, {range: config.range, animation: config.animation});
}
export let genericTeleport = {
    name: 'Teleport',
    translation: 'CHRISPREMADES.Macros.GenericTeleport.Name',
    version: '1.0.51',
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
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            options: Object.entries(teleportEffects).map(([key, value]) => ({
                value: key, 
                label: value.name, 
                requiredModules: value.requiredModules ?? []
            }))
        }
    ]
};