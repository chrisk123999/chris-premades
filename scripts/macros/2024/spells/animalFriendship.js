import {actorUtils, constants, effectUtils, genericUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.EffectImmunity.Immune'),
        img: constants.tempConditionIcon,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 100,
                mode: 5,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.typeOrRace(token.actor) === 'beast') return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let animalFriendship = {
    name: 'Animal Friendship',
    version: '1.1.10',
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