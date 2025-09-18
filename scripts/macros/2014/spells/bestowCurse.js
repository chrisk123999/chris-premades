import {activityUtils, actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    if (!workflow.failedSaves.size) {
        let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let casterEffectData;
    let casterEffectOptions = {
        identifier: 'bestowCurseSource'
    };
    let concentration = true;
    let duration = 60;
    let castLevel = workflowUtils.getCastLevel(workflow);
    switch (castLevel) {
        case 4:
            duration = 600;
            break;
        case 5:
        case 6:
            duration = 28800;
            concentration = false;
            break;
        case 7:
        case 8:
            duration = 86400;
            concentration = false;
            break;
        case 9:
            duration = 'forever';
            concentration = false;
            break;
    }
    if (duration !== 'forever') {
        let durationScale = workflow.item.system.duration.value;
        duration = Math.min(duration * durationScale, 86400);
    }
    if (!concentration) {
        let unnecessaryConcentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (unnecessaryConcentration) await genericUtils.remove(unnecessaryConcentration);
    }
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let effectName = workflow.activity.name;
    let targetEffectData = {
        name: effectName,
        img: workflow.item.img,
        origin: workflow.item.uuid,
    };
    if (!isNaN(duration)) {
        targetEffectData.duration = {
            seconds: duration
        };
    }
    switch (activityIdentifier) {
        case 'bestowCurseAbility': {
            let abilityChoices = Object.entries(CONFIG.DND5E.abilities).map(([abbr, {label}]) => [label, abbr]);
            let ability = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.BestowCurse.AbilitySelect', abilityChoices);
            if (!ability) return;
            targetEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.' + ability,
                    mode: 0, 
                    value: true,
                    priority: 20
                }, 
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.' + ability,
                    mode: 0,
                    value: true,
                    priority: 20
                }
            ];
            break;
        }
        case 'bestowCurseDamage':
            casterEffectData = {
                name: effectName,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                duration: {
                    seconds: null,
                },
                flags: {
                    'chris-premades': {
                        bestowCurse: {
                            targets: Array.from(workflow.failedSaves).map(target => target.document.uuid),
                            damageType: itemUtils.getConfig(workflow.item, 'damageType'),
                            formula: itemUtils.getConfig(workflow.item, 'formula')
                        }
                    }
                }
            };
            effectUtils.addMacro(casterEffectData, 'midi.actor', ['bestowCurseDamageSource']);
            effectUtils.addMacro(casterEffectData, 'effect', ['bestowCurse']);
            effectUtils.addMacro(targetEffectData, 'midi.actor', ['bestowCurseDamageTarget']);
            if (!isNaN(duration)) casterEffectData.duration.seconds = duration;
            break;
        case 'bestowCurseAttack':
            targetEffectData.flags = {
                'chris-premades': {
                    bestowCurse: {
                        sourceActor: workflow.actor.uuid
                    }
                }
            };
            effectUtils.addMacro(targetEffectData, 'midi.actor', ['bestowCurseAttack']);
            break;
        case 'bestowCurseTurn': {
            let saveDC = itemUtils.getSaveDC(workflow.item);
            targetEffectData.changes = [
                {
                    key: 'flags.midi-qol.OverTime',
                    mode: 0,
                    value: 'turn=start,saveAbility=wis,saveMagic=true,saveRemove=false,saveDC=' + saveDC + ',label="' + workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Turns.StartOfTurn') + ')"',
                    priority: 20
                }
            ];
            break;
        }
    }
    let targetEffectOptions = {
        identifier: activityIdentifier
    };
    if (concentration && activityIdentifier !== 'bestowCurseDamage') {
        targetEffectOptions.concentrationItem = workflow.item;
        targetEffectOptions.interdependent = true;
    }
    if (activityIdentifier === 'bestowCurseDamage') targetEffectOptions.parentEntity = true;
    if (concentration) {
        casterEffectOptions.concentrationItem = workflow.item;
        casterEffectOptions.interdependent = true;
    }
    let casterEffect;
    if (casterEffectData) casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, casterEffectOptions);
    if (casterEffect && targetEffectOptions.parentEntity) {
        targetEffectOptions.parentEntity = casterEffect;
        targetEffectOptions.interdependent = true;
    }
    effectUtils.addMacro(targetEffectData, 'effect', ['bestowCurse']);
    for (let targetToken of workflow.failedSaves) {
        await effectUtils.createEffect(targetToken.actor, targetEffectData, targetEffectOptions);
    }
    if (concentration && !isNaN(duration)) {
        let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': duration});
    }
}
async function attack({workflow}) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflowUtils.getActionType(workflow))) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseAttack');
    if (!effect) return;
    let sourceActorUuid = effect.flags['chris-premades'].bestowCurse.sourceActor;
    if (workflow.targets.map(target => target.actor?.uuid).has(sourceActorUuid)) {
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('Disadvantage: ' + effect.name);
    }
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflowUtils.getActionType(workflow))) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseSource');
    if (!effect) return;
    let {targets: validTargetUuids, damageType, formula} = effect.flags['chris-premades'].bestowCurse;
    if (!workflow.hitTargets.every(target => validTargetUuids.includes(target.document.uuid))) return;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
}
async function damageApplication({trigger, workflow, ditem}) {
    if (!workflow.hitTargets.size) return;
    if (constants.attacks.includes(workflowUtils.getActionType(workflow))) return;
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseSource');
    if (!casterEffect) return;
    let {targets: validTargetUuids, damageType, formula} = casterEffect.flags['chris-premades'].bestowCurse;
    if (workflow.hitTargets.every(target => validTargetUuids.includes(target.document.uuid))) return;
    let extraDamageTargets = workflow.hitTargets.filter(target => validTargetUuids.includes(target.document.uuid));
    if (!extraDamageTargets.size) return;
    let targetActor = trigger.token.actor;
    let damageRoll = await new CONFIG.Dice.DamageRoll(formula, workflow.item.getRollData()).evaluate();
    genericUtils.setProperty(damageRoll, 'options.type', damageType);
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: workflow.chatCard.speaker,
        flavor: genericUtils.translate('CHRISPREMADES.Macros.BestowCurse.DamageFlavor')
    });
    let hasDI = actorUtils.checkTrait(targetActor, 'di', damageType);
    if (hasDI) return;
    let damageTotal = damageRoll.total;
    let trueDamageTotal = damageTotal;
    ditem.rawDamageDetail[0].value = damageTotal;
    let hasDR = actorUtils.checkTrait(targetActor, 'dr', damageType);
    if (hasDR) damageTotal = Math.floor(damageTotal / 2);
    let hasDV = actorUtils.checkTrait(targetActor, 'dv', damageType);
    if (hasDV) damageTotal *= 2;
    let remainingDamage = damageTotal - Math.min(ditem.newTempHP, damageTotal);
    ditem.newTempHP -= (damageTotal - remainingDamage);
    ditem.tempDamage += (damageTotal - remainingDamage);
    ditem.totalDamage += trueDamageTotal;
    ditem.damageDetail[0].value += damageTotal;
    ditem.hpDamage += remainingDamage;
    ditem.newHP = Math.max(0, ditem.newHP - remainingDamage);
}
async function remove({trigger: {entity}}) {
    let identifier = genericUtils.getIdentifier(entity);
    if (identifier !== 'bestowCurseDamage') return;
    let parentEffect = await fromUuid(entity.flags['chris-premades'].parentEntityUuid);
    if (!parentEffect) return;
    let currTargetsFlag = parentEffect.flags['chris-premades'].bestowCurse.targets;
    await genericUtils.setFlag(parentEffect, 'chris-premades', 'bestowCurse.targets', currTargetsFlag.filter(uuid => uuid !== actorUtils.getFirstToken(entity.parent)?.document?.uuid));
}
export let bestowCurse = {
    name: 'Bestow Curse',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ],
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }, 
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d8',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let bestowCurseAttack = {
    name: 'Bestow Curse: Attack',
    version: bestowCurse.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};
export let bestowCurseDamageSource = {
    name: 'Bestow Curse: Damage (source)',
    version: bestowCurse.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};
export let bestowCurseDamageTarget = {
    name: 'Bestow Curse: Damage (target)',
    version: bestowCurse.version,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};