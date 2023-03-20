import {chris} from '../../../../helperFunctions.js';
export async function muddledMind({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let amplify = await chris.dialog('Amplify Blood Curse?', [['Yes', true], ['No', false]]);
    if (!amplify) return;
    let damageDice = this.actor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let roll = await new Roll(damageDice + '[none]').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: this.item.name
    });
    await chris.applyDamage(this.token, roll.total, 'none');
    let effect = chris.findEffect(this.targets.first().actor, 'Blood Curse of the Muddled Mind');
    if (!effect) return;
    let updates = {
        'duration': {
            'duration': 6,
            'label': '6 Seconds',
            'remaining': 6,
            'rounds': 1,
            'seconds': 6
        },
        'flags': {
            'dae': {
                'specialDuration': []
            }
        }
    };
    await chris.updateEffect(effect, updates);
}