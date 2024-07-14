import {chris} from '../../../../helperFunctions.js';
export async function fallenPuppet({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let amplify = await chris.dialog('Amplify Blood Curse?', [['Yes', true], ['No', false]]);
    if (!amplify) return;
    let damageDice = workflow.actor.system.scale['blood-hunter']['crimson-rite'];
    if (!damageDice) {
        ui.notifications.warn('Source actor does not appear to have a Crimson Rite scale!');
        return;
    }
    let roll = await new Roll(damageDice + '[none]').roll({'async': true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {'alias': name},
        flavor: workflow.item.name
    });
    await chris.applyDamage(workflow.token, roll.total, 'none');
    let effect = chris.findEffect(workflow.targets.first().actor, 'Blood Curse of the Fallen Puppet');
    if (!effect) return;
    let modifier = chris.getSpellMod(workflow.item);
    let updates = {
        'changes': [
            {
                'key': 'system.bonuses.All-Attacks',
                'mode': 2,
                'priority': 20,
                'value': '+' + modifier
            },
			{
				'key': 'system.attributes.hp.value',
                'mode': 4,
                'priority': 20,
                'value': 1
			}
        ]
    };
    await chris.updateEffect(effect, updates);
}
