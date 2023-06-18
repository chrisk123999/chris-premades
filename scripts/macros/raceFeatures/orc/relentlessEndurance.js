import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function relentlessEndurance(token, {item, workflow, ditem}) {
    if (ditem.newHP != 0 || ditem.oldHP === 0) return;
    let tokenActor = token.actor;
    let effect = chris.findEffect(tokenActor, 'Relentless Endurance');
    if (!effect) return;
    let maxHP = tokenActor.system.attributes?.hp?.max;
    if (!maxHP) return;
    if (ditem.appliedDamage > (maxHP + ditem.oldHP)) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (originItem.system.uses.value === 0) return;
    let selection = await chris.dialog('Use Relentless Endurance?', [['Yes', true], ['No', false]]);
    if (!selection || selection === false) return;
    let queueSetup = await queue.setup(workflow.uuid, 'relentlessEndurance', 389);
    if (!queueSetup) return;
    await originItem.update({
        'system.uses.value': originItem.system.uses.value -1
    });
    ditem.newHP = 1;
    ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
    queue.remove(workflow.uuid);
}