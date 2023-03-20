import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function healingLight({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let queueSetup = await queue.setup(this.uuid, 'healingLight', 50);
    if (queueSetup) return;
    let healingLightFeatureUses = this.item.system.uses.value + 1;
    let healingLightMenuUses = Math.min(Math.max(1, this.actor.system.abilities.cha.mod), healingLightFeatureUses);
    let lightMenu = [];
    for (let i = healingLightMenuUses; i > 0; i--) {
        let diceString = i + 'd6';
        lightMenu.push([diceString, i]);
    }
    let selection = await chris.dialog('How many dice do you want to use?', lightMenu)
    await this.item.update({
        'system.uses.value': healingLightFeatureUses - selection
     });
     let diceRoll = await new Roll(selection + 'd6[healing]').roll({async: true});
     await this.setDamageRoll(diceRoll);
     queue.remove(this.item.uuid);
}