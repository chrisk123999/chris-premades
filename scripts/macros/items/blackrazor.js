import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.damageList) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let targetRace = chris.raceOrType(targetActor);
    if (targetRace != 'undead') {
        if (targetRace === 'construct') return;
        let doHealing = false;
        for (let i of workflow.damageList) {
            if (i.oldHP != 0 && i.newHP === 0) {
                doHealing = true;
                break;
            }
        }
        if (!doHealing) return;
        let maxHP = targetActor.system.attributes.hp.max;
        let currentTempHP = workflow.actor.system.attributes.hp.temp;
        if (currentTempHP <= maxHP) await chris.applyDamage([workflow.token], maxHP, 'temphp');
        let effect = chris.findEffect(workflow.actor, 'Devoured Soul');
        if (effect) return;
        let effectData = {
            'label': 'Devoured Soul',
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 86400
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.advantage.attack.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.save.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.midi-qol.advantage.ability.check.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                },
                {
                    'key': 'flags.chris-premades.feature.onHit.blackrazor',
                    'mode': 5,
                    'value': 'true',
                    'priority': 20
                }
            ]
        };
        await chris.createEffect(workflow.actor, effectData);
    } else {
        let damageRoll = await new Roll('1d10[necrotic]').roll({async: true});
        await chris.applyWorkflowDamage(workflow.token, damageRoll, 'necrotic', [workflow.token], workflow.item.name, workflow.itemCardId);
        return;
    }
}
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    if (chris.raceOrType(targetActor) != 'undead') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'blackrazor', 50);
    if (!queueSetup) return;
    let damageFormula = '1d10[healing]';
    if (workflow.isCritical) damageFormula = chris.getCriticalFormula(damageFormula);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function onHit(workflow, targetToken) {
    if (targetToken.actor.system.attributes.hp.temp != 0) return;
    let effect = chris.findEffect(targetToken.actor, 'Devoured Soul');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let blackrazor = {
    'item': item,
    'damage': damage,
    'onHit': onHit
}