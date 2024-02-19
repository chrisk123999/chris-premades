import {chris} from '../../../../helperFunctions.js';
export async function bolsteringMagic({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let selection = await chris.dialog(workflow.item.name, [['Attack and Ability Bonus', 'd3'], ['Regain Spell Slot', 'spell']], 'Which option?');
    if (!selection) return;
    if (selection === 'd3') {
        let effectData = {
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 600
            },
            'name': workflow.item.name,
            'changes': [
                {
                    'key': 'system.bonuses.All-Attacks',
                    'mode': 2,
                    'value': '+1d3',
                    'priority': 20
                },
                {
                    'key': 'system.bonuses.abilities.check',
                    'mode': 2,
                    'value': '+1d3',
                    'priority': 20
                }
            ]
        };
        await chris.createEffect(targetActor, effectData);
    } else {
        let roll = await new Roll('1d3').roll({'async': true});
        roll.toMessage({
            rollMode: 'roll',
            speaker: {'alias': name},
            flavor: workflow.item.name
        });
        let checkNumber = roll.total;
        while (checkNumber > 0) {
            let value = targetActor.system.spells['spell' + checkNumber].value;
            let max = targetActor.system.spells['spell' + checkNumber].max;
            if (value < max) {
                let updates = {
                    'actor': {
                        'system': {
                            'spells': {
                                ['spell' + checkNumber]: {
                                    'value': value + 1
                                }
                            }
                        }
                    }
                }
                let options = {
                    'permanent': true,
                    'name': workflow.item.name,
                    'description': workflow.item.name
                };
                await warpgate.mutate(targetToken.document, updates, {}, options);
                ui.notifications.info('Spell slot regained!');
                return;
            } else {
                checkNumber -= 1;
            }
            if (checkNumber === 0) ui.notifications.info('No spell slots to regain!');
        }
    }
}