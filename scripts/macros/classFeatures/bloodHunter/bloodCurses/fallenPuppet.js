import {chris} from '../../../../helperFunctions.js';
export async function fallenPuppet({speaker, actor, token, character, item, args}) {
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
    let effect = chris.findEffect(this.targets.first().actor, 'Blood Curse of the Fallen Puppet');
    if (!effect) return;
    let modifier = chris.getSpellMod(this.item);
    let updates = {
        'changes': [
            {
                'key': 'system.bonuses.All-Attacks',
                'mode': 2,
                'priority': 20,
                'value': '+' + modifier
            }
        ]
    };
    await chris.updateEffect(effect, updates);
}