import {chris} from '../../../helperFunctions.js';
export async function fangedBite(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let selection = await chris.dialog('Fanged Bite', [['Restore HP', 'hp'], ['Skill Bonus', 'skill']]);
    if (!selection) selection = 'hp';
    let damageDealt = workflow.damageList[0].appliedDamage;
    switch (selection) {
        case 'hp':
            chris.applyDamage(workflow.token, damageDealt, 'healing');
            break;
        case 'skill':
            let effectData = {
                'label': 'Fanged Bite',
                'icon': 'icons/creatures/abilities/fang-tooth-blood-red.webp',
                'duration': {
                    'seconds': 86400
                },
                'changes': [
                    {
                        'key': 'system.bonuses.abilities.check',
                        'mode': 2,
                        'value': damageDealt,
                        'priority': 20
                    },
                    {
                        'key': 'system.bonuses.All-Attacks',
                        'mode': 2,
                        'value': damageDealt,
                        'priority': 20
                    }
                ],
                'flags': {
                    'dae': {
                        'specialDuration': [
                            '1Attack',
                            'isSkill'
                        ]
                    }
                }
            };
            await chris.createEffect(workflow.actor, effectData);
            break;
    }
}