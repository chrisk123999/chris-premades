import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function healingLight({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let queueSetup = await queue.setup(workflow.uuid, 'healingLight', 50);
    if (!queueSetup) return;
    let healingLightFeatureUses = workflow.item.system.uses.value + 1;
    let healingLightMenuUses = Math.min(Math.max(1, workflow.actor.system.abilities.cha.mod), healingLightFeatureUses);
    let lightMenu = [];
    for (let i = healingLightMenuUses; i > 0; i--) {
        let diceString = i + 'd6';
        lightMenu.push([diceString, i]);
    }
    let selection = await chris.dialog(workflow.item.name, lightMenu, 'How many dice do you want to use?')
    await workflow.item.update({
        'system.uses.value': healingLightFeatureUses - selection
     });
     let damageRoll = await chris.damageRoll(workflow, selection + 'd6[healing');
     await workflow.setDamageRolls([damageRoll]);
     queue.remove(workflow.item.uuid);
}