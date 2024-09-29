import {effectUtils, itemUtils, rollUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(trigger.entity, 'parry');
    if (isNaN(Number(config.formula))) {
        let roll = await rollUtils.rollDice(config.formula, {actor: workflow.actor, chatMessage: config.showRoll, flavor: trigger.entity.name});
        config.formula = config.showRoll ? roll.roll.total : roll.total;
    }
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+ ' + config.formula,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Reaction'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let parry = {
    name: 'Parry',
    translation: 'CHRISPREMADES.Macros.Parry.Name',
    version: '0.7.78',
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
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '@prof'
        },
        {
            value: 'showRoll',
            label: 'CHRISPREMADES.Config.ShowRoll',
            type: 'checkbox',
            default: true
        }
    ]
};