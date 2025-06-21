import {effectUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+' + workflow.actor.system.abilities.int.mod,
                priority: 20
            },
            {
                key: 'system.attributes.movement.walk',
                mode: 2,
                value: '+' + genericUtils.handleMetric(10).toString(),
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.skill.acr',
                mode: 0,
                value: '1',
                priority: 20
            },
            {
                key: 'system.attributes.concentration.bonuses.save',
                mode: 2,
                value: '+' + workflow.actor.system.abilities.int.mod,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'zeroHP'
                ]
            }
        }
    };
    let songOfVictory = itemUtils.getItemByIdentifier(workflow.actor, 'songOfVictory');
    if (songOfVictory) {
        effectData.changes.push({
            key: 'system.bonuses.mwak.damage',
            mode: 2,
            value: '+' + workflow.actor.system.abilities.int.mod,
            priority: 20
        });
    }
    let songOfDefense = itemUtils.getItemByIdentifier(workflow.actor, 'songOfDefense');
    if (songOfDefense) {
        effectUtils.addMacro(effectData, 'midi.actor', ['songOfDefense']);
    }
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'bladesong'});
}
export let bladesong = {
    name: 'Bladesong',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};