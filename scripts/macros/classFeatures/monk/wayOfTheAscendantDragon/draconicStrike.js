import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function draconicStrike({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.hitTargets.size) return;
    let unarmedStrike = chris.getItem(workflow.actor, 'Unarmed Strike (Monk)');
    if (!unarmedStrike) return;
    if (workflow.item.uuid != unarmedStrike.uuid) return;
    let feature = chris.getItem(workflow.actor, 'Draconic Strike');
    if (!feature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'draconicStrike', 350);
    if (!queueSetup) return;
    let options = [
        ['🧪 Acid', 'acid'],
        ['❄️ Cold', 'cold'],
        ['🔥 Fire', 'fire'],
        ['⚡ Lightning', 'lightning'],
        ['☠️ Poison', 'poison']
    ];
    let selection = await chris.dialog(feature.name, options, 'Change ' + workflow.item.name + '\'s damage type?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageRoll = workflow.damageRoll
    damageRoll.terms[0].options.flavor = selection;
    damageRoll.terms[2].options.flavor = selection;
    damageRoll._formula = damageRoll._formula.replace(workflow.defaultDamageType, selection);
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}