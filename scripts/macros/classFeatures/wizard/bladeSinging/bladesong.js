import {effectUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
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
                value: '+10',
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
    let songOfVictory = itemUtils.getItemByIdentifer(workflow.actor, 'songOfVictory');
    if (songOfVictory) {
        effectData.changes.push({
            key: 'system.bonuses.mwak.damage',
            mode: 2,
            value: '+' + workflow.actor.system.abilities.int.mod,
            priority: 20
        });
    }
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let bladesong = {
    name: 'Bladesong',
    version: '0.12.4',
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