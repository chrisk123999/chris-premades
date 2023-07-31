import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function damage(targetToken, {workflow, ditem}) {
    if (ditem.newHP >= ditem.oldHP) return;
    async function check(target) {
        let effect = chris.findEffect(target.actor, 'Arcane Ward');
        if (!effect) return;
        if (!effect.origin) return;
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        let uses = originItem.system.uses.value;
        if (uses === 0) return;
        let absorbed = Math.max(ditem.appliedDamage, uses);
        let keptDamage = ditem.appliedDamage - absorbed;
        if (ditem.oldTempHP > 0) {
            if (keptDamage > ditem.oldTempHP) {
                ditem.newTempHP = 0;
                keptDamage -= ditem.oldTempHP;
                ditem.tempDamage = ditem.oldTempHP;
            } else {
                ditem.newTempHP = ditem.oldTempHP - keptDamage;
                ditem.tempDamage = keptDamage;
            }
        }
        let maxHP = target.actor.system.attributes.hp.max;
        ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
        ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
        ditem.appliedDamage = keptDamage;
        ditem.totalDamage = keptDamage;
        let updates = {
            'embedded': {
                'Item': {
                    [originItem.name]: {
                        'system.uses.value': uses - absorbed
                    }
                }
            }
        };
        let options = {
            'permanent': true,
            'name': originItem.name,
            'description': originItem.name
        };
        await warpgate.mutate(target.document, updates, {}, options);
        return true;
    }
    let queueSetup = queue.setup(workflow.uuid, 'arcaneWard', 350);
    if (!queueSetup) return;
    if (targetToken.actor.system.classes?.wizard?.subclass?.name === 'School of Abjuration') {
        let shielded = await check(targetToken);
        if (shielded) {
            queue.remove(workflow.uuid);
            return;
        }
    }
    let tokens = chris.findNearby(targetToken, 30, 'ally').filter(i => i.actor.classes?.wizard?.subclass?.name === 'School of Abjuration' && i.actor.classes?.wizard?.system?.level >= 6 && !chris.findEffect(i.actor, 'Reaction'));
    if (tokens.length === 0) {
        queue.remove(workflow.uuid);
        return;
    }
    for (let token of tokens) {
        let selection = await chris.remoteDialog('Arcane Ward', [['Yes', true], ['No', false]], chris.firstOwner(token).id, 'Protect ' + token.actor.name + ' with your arcane ward?');
        if (!selection) continue;
        let shielded = check(token);
        if (shielded) {
            await chris.addCondition(token.actor, 'Reaction', false);
            break;
        }
    }
    queue.remove(workflow.uuid);
}
async function spell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell') return;
    if (workflow.item.system.school != 'abj') return;
    if (workflow.castData.castLevel === 0) return;
    let effect = chris.findEffect(target.actor, 'Arcane Ward');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let maxUses = workflow.actor.classes.wizard.system.level * 2 + workflow.actor.system.abilities.int.mod;
    let add = workflow.castData.castLevel * 2;
    if (!originItem.flags['chris-premades']?.feature?.arcaneWard?.firstUse) {
        add = maxUses;
        await originItem.setFlag('chris-premades', 'feature.arcaneWard.firstUse', true);
    }
    let uses = originItem.system.uses.value;
    let updates = {
        'embedded': {
            'Item': {
                [originItem.name]: {
                    'system.uses.value': uses + add,
                    'system.uses.max': maxUses
                }
            }
        }
    };
    let options = {
        'permanent': true,
        'name': originItem.name,
        'description': originItem.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function longRest(actor, data) {
    let effect = chris.findEffect(actor, 'Arcane Ward');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let updates = {
        'embedded': {
            'Item': {
                [originItem.name]: {
                    'system.uses.value': 0,
                    'system.uses.max': actor.classes.wizard.system.level * 2 + actor.system.abilities.int.mod,
                    'flags.chris-premades.feature.arcaneWard.firstUse': false
                }
            }
        }
    };
    let options = {
        'permanent': true,
        'name': originItem.name,
        'description': originItem.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
export let arcaneWard = {
    'damage': damage,
    'spell': spell,
    'longRest': longRest
}