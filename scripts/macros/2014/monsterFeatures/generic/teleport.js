import {Teleport} from '../../../../lib/teleport.js';
import {itemUtils, rollUtils} from '../../../../utils.js';
import {teleportEffects} from '../../../animations/teleportEffects.js';
async function late({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'genericTeleport');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let range = await rollUtils.rollDice(String(config.range), {chatMessage: config.message, entity: workflow.activity, flavor: workflow.item.name});
    range = config.message ? range.roll.total : range.total;
    await Teleport.target([workflow.token], workflow.token, {range, animation: config.animation});
}
export let genericTeleport = {
    name: 'Generic Teleport',
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
            type: 'text',
            default: 30
        },
        {
            value: 'message',
            label: 'CHRISPREMADES.Config.DisplayFormulaRoll',
            type: 'checkbox',
            default: false
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