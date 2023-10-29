import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js'
import {queue} from '../../utility/queue.js';
let strikeUsed = false;
async function rest(actor ,data) {
    let item = chris.getItem(actor, 'Wraps of Dyamak');
    if (!item) return;
    if (!item.system.equipped || item.system.attunement === 1) return;
    let feature = chris.getItem(actor, 'Ki Points');
    if (!feature) return;
    let tokens = actor.getActiveTokens();
    if (!tokens) return;
    await chris.applyDamage([tokens[0]], feature.system.uses.max, 'temphp');
    await item.displayCard();
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    console.log(workflow);
    let unarmedStrike = chris.getItem(workflow.actor, 'Unarmed Strike (Monk)');
    if (!unarmedStrike) return;
    if (workflow.item.uuid != unarmedStrike.uuid) return;
    let wrapsOffDyamakItem = chris.getItem(workflow.actor, 'Wraps of Dyamak');
    if (!wrapsOffDyamakItem) return;
    let tier = chris.getConfiguration(wrapsOffDyamakItem, 'tier') ?? 1;
    let queueSetup = await queue.setup(workflow.item.uuid, 'wrapsOffDyamak', 150);
    if (!queueSetup) return;
    let attackRoll = await chris.addToRoll(workflow.attackRoll, tier);
    await workflow.setAttackRoll(attackRoll);
    queue.remove(workflow.item.uuid);
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    let unarmedStrike = chris.getItem(workflow.actor, 'Unarmed Strike (Monk)');
    if (!unarmedStrike) return;
    if (workflow.item.uuid != unarmedStrike.uuid) return;
    let wrapsOffDyamakItem = chris.getItem(workflow.actor, 'Wraps of Dyamak');
    if (!wrapsOffDyamakItem) return;
    let tier = chris.getConfiguration(wrapsOffDyamakItem, 'tier') ?? 1;
    let queueSetup = await queue.setup(workflow.item.uuid, 'wrapsOffDyamak', 150);
    if (!queueSetup) return;
    let damageFormula = workflow.damageRoll._formula + ' + ' + tier + '[' + workflow.damageRoll.terms[0].flavor + ']';
    if (tier === 3 && workflow.hitTargets.size) {
        if (wrapsOffDyamakItem.system.uses.value) {
            let selection = await chris.dialog(wrapsOffDyamakItem.name, constants.yesNo, 'Make a ravenous strike?');
            if (selection) {
                let bonusDamageFormula = '6d6[necrotic]';
                if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
                damageFormula += ' + ' + bonusDamageFormula;
                wrapsOffDyamakItem.update({'system.uses.value': 0});
                wrapsOffDyamakItem.displayCard();
                strikeUsed = true;
            }
        }
    }
    if (workflow.isCritical) {
        if (tier >= 2) {
            let crimsonMistFeature = chris.getItem(workflow.actor, 'Crimson Mist');
            if (crimsonMistFeature && crimsonMistFeature.system.uses.value != 1) crimsonMistFeature.update({'system.uses.value': 1}); 
        }
        if (tier === 3 && wrapsOffDyamakItem.system.uses.value != 1) wrapsOffDyamakItem.update({'system.uses.value': 1});
    }
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function heal({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!strikeUsed) return;
    let healing = chris.totalDamageType(workflow.targets.first().actor, workflow.damageDetail, 'necrotic');
    await chris.applyDamage([workflow.token], healing, 'healing');
    strikeUsed = false;
}
export let wrapsOffDyamak = {
    'rest': rest,
    'attack': attack,
    'damage': damage,
    'heal': heal
}