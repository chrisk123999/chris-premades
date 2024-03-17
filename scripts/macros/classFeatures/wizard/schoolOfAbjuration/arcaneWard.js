import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
import {constants} from '../../../../constants.js';
async function damage(targetToken, {workflow, ditem}) {
    if (ditem.newHP >= ditem.oldHP || !ditem.wasHit) return;
    async function check(target) {
        let originItem = chris.getItem(target.actor, 'Arcane Ward');
        if (!originItem) return;
        let uses = originItem.system.uses.value;
        if (!uses) return;
        let absorbed = Math.min(ditem.appliedDamage, uses);
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
    let queueSetup = await queue.setup(workflow.uuid, 'arcaneWard', 350);
    if (!queueSetup) return;
    if (targetToken.actor.classes?.wizard?.subclass?.system?.identifier === 'school-of-abjuration') {
        let shielded = await check(targetToken);
        if (shielded) {
            queue.remove(workflow.uuid);
            return;
        }
    }
    let tokens = chris.findNearby(targetToken, 30, 'ally').filter(i => i.actor.classes?.wizard?.subclass?.system?.identifier === 'school-of-abjuration' && chris.getItem(i.actor, 'Projected Ward') && !chris.findEffect(i.actor, 'Reaction'));
    if (tokens.length === 0) {
        queue.remove(workflow.uuid);
        return;
    }
    for (let token of tokens) {
        let projectedWard = chris.getItem(token.actor, 'Projected Ward');
        if (!projectedWard) continue;
        let prompt = chris.getConfiguration(projectedWard, 'prompt') ?? true;
        if (!prompt) continue;
        let firstOwner = chris.firstOwner(token);
        await chris.thirdPartyReactionMessage(firstOwner);
        let message = 'Protect ' + targetToken.actor.name + ' with your arcane ward?';
        if (firstOwner.isGM) message = '[' + token.actor.name + '] ' + message;
        let selection = await chris.remoteDialog('Arcane Ward', constants.yesNo, firstOwner.id, message);
        if (!selection) continue;
        let shielded = check(token);
        if (shielded) {
            await chris.addCondition(token.actor, 'Reaction', false);
            await projectedWard.use();
        }
    }
    await chris.clearThirdPartyReactionMessage();
    queue.remove(workflow.uuid);
}
async function spell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell') return;
    if (workflow.item.system.school != 'abj') return;
    if (workflow.castData.castLevel === 0) return;
    let effect = chris.findEffect(workflow.actor, 'Arcane Ward');
    if (!effect) return;
    if (!effect.origin) return;
    let originItem = effect.parent;
    if (!originItem) return;
    let maxUses = workflow.actor.classes.wizard.system.levels * 2 + workflow.actor.system.abilities.int.mod;
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
                    'system.uses.value': Math.clamped(uses + add, 0, maxUses),
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
    let originItem = effect.parent;
    if (!originItem) return;
    await originItem.update({
        'system.uses.value': 0,
        'system.uses.max': actor.classes.wizard.system.levels * 2 + actor.system.abilities.int.mod,
        'flags.chris-premades.feature.arcaneWard.firstUse': false
    });
}
export let arcaneWard = {
    'damage': damage,
    'spell': spell,
    'longRest': longRest
}