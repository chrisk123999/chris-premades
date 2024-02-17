import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function damage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let targetId = workflow.actor.flags['chris-premades']?.feature?.hexbladesCurse;
    if (!targetId) return;
    let targetToken = workflow.hitTargets.first();
    if (targetId != targetToken.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'hexbladesCurse', 250);
    if (!queueSetup) return;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    let damageFormula = workflow.damageRoll._formula + ' + ' + workflow.actor.system.attributes.prof + '[' + defaultDamageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
    return;
}
async function damageApplication({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size < 2) return;
    let targetId = workflow.actor.flags['chris-premades']?.feature?.hexbladesCurse;
    if (!targetId) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'hexbladesCurse', 250);
    if (!queueSetup) return;
    let targetDamage = workflow.damageList.find(i => i.tokenId === targetId);
    if (!targetDamage) return;
    let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
    if (!targetActor) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    let hasDI = chris.checkTrait(targetActor, 'di', defaultDamageType);
    if (hasDI) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageTotal = workflow.actor.system.attributes.prof;
    let hasDR = chris.checkTrait(targetActor, 'dr', defaultDamageType);
    if (hasDR) damageTotal = Math.floor(damageTotal / 2);
    targetDamage.damageDetail[0].push(
        {
            'damage': damageTotal,
            'type': defaultDamageType
        }
    );
    targetDamage.totalDamage += damageTotal;
    targetDamage.appliedDamage += damageTotal;
    targetDamage.hpDamage += damageTotal;
    if (targetDamage.oldTempHP > 0) {
        if (targetDamage.oldTempHP >= damageTotal) {
            targetDamage.newTempHP -= damageTotal;
        } else {
            let leftHP = damageTotal - targetDamage.oldTempHP;
            targetDamage.newTempHP = 0;
            targetDamage.newHP -= leftHP;
        }
    } else {
        targetDamage.newHP -= damageTotal;
    }
    queue.remove(workflow.item.uuid);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTypes = [
        'mwak',
        'msak',
        'rwak',
        'rsak'
    ];
    if (workflow.targets.size != 1 || !validTypes.includes(workflow.item.system.actionType)) return;
    let targetId = workflow.actor.flags['chris-premades']?.feature?.hexbladesCurse;
    if (!targetId) return;
    if (workflow.targets.first().id != targetId) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'hexbladesCurse', 250);
    if (!queueSetup) return;
    let effectData = {
        'label': 'Critical Threshold',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.grants.criticalThreshold',
                'value': '19',
                'mode': 5,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'isAttacked'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.targets.first().actor, effectData);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.feature.hexbladesCurse',
                'mode': 5,
                'value': workflow.targets.first().id,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.hexbladesCurse.damage,postDamageRoll',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.hexbladesCurse.damageApplication,preDamageApplication',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.hexbladesCurse.attack,preambleComplete',
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'zeroHP'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
}
async function defeated(origin, effect) {
    await warpgate.wait(100);
    let warlockLevels = origin.actor.classes.warlock?.system?.levels;
    if (warlockLevels >= 14) {
        async function effectMacro() {
            let selection = await chrisPremades.helpers.dialog('Master of Hexes: Heal self?', [['Yes', true], ['No', false]]);
            if (selection) {
                let damage = Math.max(origin.actor.system.abilities.cha.mod, 1);
                let warlockLevels = origin.actor.classes.warlock?.system?.levels;
                if (warlockLevels) damage += warlockLevels;
                await chrisPremades.helpers.applyDamage(token, damage, 'healing');
                let targetEffect = chrisPremades.helpers.findEffect(actor, origin.name);
                if (targetEffect) await chrisPremades.helpers.removeEffect(effect);
            } else {
                await origin.update({'system.uses.value': 1});
            }
            await effect.delete();
        }
        let effectData = {
            'label': origin.name + ': Healing',
            'icon': origin.img,
            'origin': origin.uuid,
            'duration': {
                'seconds': 1
            },
            'flags': {
                'effectmacro': {
                    'onCreate': {
                        'script': chris.functionToString(effectMacro)
                    }
                }
            }
        }
        await chris.createEffect(origin.actor, effectData);
        await chris.removeEffect(effect);
        return;
    }
    let damage = Math.max(origin.actor.system.abilities.cha.mod, 1);
    if (warlockLevels) damage += warlockLevels;
    let tokens = origin.actor.getActiveTokens();
    if (tokens.length != 0) await chris.applyDamage(tokens[0], damage, 'healing');
    await chris.removeEffect(effect);
}
async function removed(origin) {
    let targetEffect = chris.findEffect(origin.actor, origin.name);
    if (!targetEffect) return;
    await chris.removeEffect(targetEffect);
}
export let hexbladesCurse = {
    'item': item,
    'damage': damage,
    'damageApplication': damageApplication,
    'attack': attack,
    'defeated': defeated,
    'removed': removed
}