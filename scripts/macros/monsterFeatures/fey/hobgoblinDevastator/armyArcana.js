import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.item) return;
    if (workflow.item.type !== 'spell') return;
    let effectData = {
        name: workflow.item.name,
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 5,
                value: 100,
                priority: 120
            },
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['sculptSpellsTarget']);
    let targets = workflow.targets.filter(i => i.document.disposition === workflow.token.document.disposition);
    await Promise.all(targets.map(async i => await effectUtils.createEffect(i.actor, effectData)));
}
export let armyArcana = {
    name: 'Army Arcana',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    monster: {
        names: ['Hobgoblin Devastator']
    }
};