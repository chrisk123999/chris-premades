import {combatUtils, effectUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    let effectData;
    if (targetToken.document.disposition === workflow.token.document.disposition) {
        effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: combatUtils.inCombat() ? 12 : 3600
            },
            changes: [
                {
                    key: 'flags.midi-qol.advantage.ability.all',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ],
            flags: {
                dae: {
                    specialDuration: [
                        'isSkill',
                        'turnStartSource'
                    ]
                }
            }
        };
    } else {
        effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: {
                seconds: 12
            },
            changes: [
                {
                    key: 'flags.midi-qol.grants.advantage.attack.all',
                    mode: 0,
                    value: 'tokenId != "' + workflow.token.document.id + '"',
                    priority: 20
                }
            ],
            flags: {
                dae: {
                    specialDuration: [
                        'turnStartSource'
                    ]
                },
                'chris-premades': {
                    specialDuration: [
                        'attackedByAnotherCreature'
                    ]
                }
            }
        };
    }
    await effectUtils.createEffect(targetToken.actor, effectData);
}
export let help = {
    name: 'Help',
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