import {actorUtils, constants, effectUtils, genericUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
}
async function early({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await upcastTargets.plusOne({workflow});
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.GenericEffects.InvalidTarget'),
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                value: 99,
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
    for (let target of workflow.targets) {
        if (actorUtils.typeOrRace(target.actor) !== 'humanoid' && target.targeted.has(game.user)) await effectUtils.createEffect(target.actor, effectData, {identifier: 'holdPersonInvalidTarget'});
    }
}
export let holdPerson = {
    name: 'Hold Person',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};