import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function damageTransfer({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.hitTargets.size) return;
    let sourceToken = args[0].options.token;
    let targetHasEffect = chris.findNearby(sourceToken, 5, 'all', true)?.find(t=>chris.findEffect(t.actor, 'Smother')?.origin === sourceToken.actor.items.getName('Smother')?.uuid);
    if (!targetHasEffect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'smother', 400);
    if (!queueSetup) return;
    let ditem = workflow.damageItem;
    if (ditem.newHP > ditem.oldHP) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let keptDamage = Math.floor(ditem.appliedDamage / 2);
    await chris.applyDamage([targetHasEffect], keptDamage, 'none');
    if (ditem.oldTempHP > 0) {
        if (keptDamage > ditem.oldTempHP) {
            ditem.newTempHP = 0;
            keptDamage -= ditem.oldTempHP;
            ditem.tempDamage = ditem.oldTempHP;
        } else {
            ditem.newTempHP = ditem.oldTempHP - keptDamage;
            ditem.tempDamage = keptDamage;
            keptDamage = 0;
        }
    }
    let maxHP = sourceToken.actor.system.attributes.hp.max;
    ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
    ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
    ditem.appliedDamage = keptDamage;
    ditem.totalDamage = keptDamage;
    queue.remove(workflow.item.uuid);
}