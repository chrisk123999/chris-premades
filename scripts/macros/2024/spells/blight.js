import {actorUtils, constants, effectUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: 'Auto Fail',
        img: constants.tempConditionIcon,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.fail.ability.save.all',
                value: 1,
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            }
        },
        origin: workflow.item.uuid
    };
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.typeOrRace(token.actor) === 'plant') await effectUtils.createEffect(token.actor, effectData, {animate: false});
    }));
}
export let blight = {
    name: 'Blight',
    version: '1.1.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};