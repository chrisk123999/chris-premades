import {chris} from '../../../helperFunctions.js';
export async function vampiricBite({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let selection = await chris.dialog('Fanged Bite', [['Restore HP', 'hp'], ['Skill Bonus', 'skill']]);
    if (!selection) selection = 'hp';
    let damage = chris.totalDamageType(this.targets.first().actor, this.damageDetail, 'piercing');
    if (!damage) return;
    switch (selection) {
        case 'hp':
            chris.applyDamage(this.token, damage, 'healing');
            break;
        case 'skill':
            let effectData = {
                'label': 'Vampiric Bite',
                'icon': this.item.img,
                'duration': {
                    'seconds': 86400
                },
                'changes': [
                    {
                        'key': 'system.bonuses.abilities.check',
                        'mode': 2,
                        'value': damage,
                        'priority': 20
                    },
                    {
                        'key': 'system.bonuses.All-Attacks',
                        'mode': 2,
                        'value': damage,
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
            await chris.createEffect(this.actor, effectData);
            break;
    }
}