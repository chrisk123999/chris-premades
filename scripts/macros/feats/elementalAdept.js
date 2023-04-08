import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function elementalAdept(token, {item, workflow, ditem}) {
    if (!workflow.actor?.flags?.['chris-premades']?.feat?.elementalAdept || !workflow.damageRoll || workflow.item?.type != 'spell') return;
    let acidAdept = workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.acid;
    let coldAdept = workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.cold;
    let fireAdept = workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.fire;
    let lightningAdept = workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.lightning;
    let thunderAdept = workflow.actor.flags['chris-premades']?.feat?.elementalAdept?.thunder;
    let validTypes = new Set([]);
    if (acidAdept) validTypes.add('acid');
    if (coldAdept) validTypes.add('cold');
    if (fireAdept) validTypes.add('fire');
    if (lightningAdept) validTypes.add('lightning');
    if (thunderAdept) validTypes.add('thunder');
    if (validTypes.size === 0) return;
    if (chris.totalDamageType(token.actor, workflow.damageDetail, 'temphp') > 0 || chris.totalDamageType(token.actor, workflow.damageDetail, 'healing') > 0) return; 
    let newDamageTotal = 0;
    let hpDamageTotal = 0;
    let queueSetup = await queue.setup(workflow.uuid, 'elementalAdept', 350);
    if (!queueSetup) return;
    for (let i of workflow.damageRoll.terms) {
        if (validTypes.has(i.flavor.toLowerCase()) && !i.isDeterministic && !isNaN(i.total)) {
            let termTotal = 0;
            for (let j of i.results) {
                termTotal += Math.max(j.result, 2);
            }
            if (!chris.checkTrait(token.actor, 'di', i.flavor)) {
                if (chris.checkTrait(token.actor, 'dv', i.flavor)) {
                    hpDamageTotal += termTotal * 2;
                } else {
                    hpDamageTotal += termTotal;
                }
            }
            newDamageTotal += termTotal;
        } else {
            if (isNaN(i.total)) continue;
            if (chris.checkTrait(token.actor, 'dr', i.flavor)) {
                hpDamageTotal += Math.floor(i.total / 2);
            } else if (!chris.checkTrait(token.actor, 'di', i.flavor)) {
                hpDamageTotal += i.total;
            }
            newDamageTotal += i.total;
        }
    }
    if (ditem.totalDamage === newDamageTotal) {
        queue.remove(workflow.uuid);
        return;
    }
    if (ditem.oldTempHP > 0) {
        if (hpDamageTotal > ditem.oldTempHP) {
            ditem.newTempHP = 0;
            hpDamageTotal -= ditem.oldTempHP;
            ditem.tempDamage = ditem.oldTempHP;
        } else {
            ditem.newTempHP = ditem.oldTempHP - hpDamageTotal;
            ditem.tempDamage = hpDamageTotal;
        }
    }
    if (hpDamageTotal > 0) {
        let maxHP = token.actor.system.attributes.hp.max;
        ditem.hpDamage = Math.clamped(hpDamageTotal, 0, maxHP);
        ditem.newHP = Math.clamped(ditem.oldHP - hpDamageTotal, 0, maxHP);
    }
    ditem.appliedDamage = hpDamageTotal;
    ditem.totalDamage = newDamageTotal;
    queue.remove(workflow.uuid);
}