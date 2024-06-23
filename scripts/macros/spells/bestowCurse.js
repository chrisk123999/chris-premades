import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let casterEffectData;
    let casterEffectOptions = {
        identifier: 'bestowCurseSource'
    };
    let targetEffectsArray = [];
    let concentration = true;
    let duration = 60;
    let castLevel = workflow.castData.castLevel;
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
    if (!concentration) {
        let unnecessaryConcentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (unnecessaryConcentration) await genericUtils.remove(unnecessaryConcentration);
    }
    let buttons = [
        ['CHRISPREMADES.macros.bestowCurse.ability', 'Ability'],
        ['CHRISPREMADES.macros.bestowCurse.attack', 'Attack'],
        ['CHRISPREMADES.macros.bestowCurse.turn', 'Turn'],
        ['CHRISPREMADES.macros.bestowCurse.damage', 'Damage'],
        ['CHRISPREMADES.macros.bestowCurse.other', 'Other']
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, genericUtils.translate('CHRISPREMADES.macros.bestowCurse.selectCurse'), buttons);
    if (!selection) return;
    let effectName = workflow.item.name + ': ' + genericUtils.translate(buttons.find(x => x[1] === selection)[0]);
    for (let targetToken of workflow.failedSaves) {
        let targetEffectData = {
            name: effectName,
            icon: workflow.item.img,
            origin: workflow.item.uuid,
        };
        if (!isNaN(duration)) {
            targetEffectData.duration = {
                seconds: duration
            };
        }
        switch (selection) {
            case 'Ability': {
                let abilityChoices = Object.entries(CONFIG.DND5E.abilities).map(([abbr, {label}]) => [label, abbr]);
                let ability = await dialogUtils.buttonDialog(workflow.item.name, genericUtils.translate('CHRISPREMADES.macros.bestowCurse.abilitySelect'), abilityChoices);
                if (!ability) continue;
                targetEffectData.changes = [
                    {
                        key: 'flags.midi-qol.disadvantage.ability.check.' + ability,
                        mode: 0, 
                        value: true,
                        priority: 20
                    }, {
                        key: 'flags.midi-qol.disadvantage.ability.save.' + ability,
                        mode: 0,
                        value: true,
                        priority: 20
                    }
                ];
                break;
            }
            case 'Damage':
                if (!casterEffectData) {
                    casterEffectData = {
                        name: effectName,
                        icon: workflow.item.img,
                        origin: workflow.item.uuid,
                        duration: {
                            seconds: null,
                        },
                        flags: {
                            'chris-premades': {
                                bestowCurse: {
                                    targets: [targetToken.document.uuid],
                                    damageType: itemUtils.getConfig(workflow.item, 'damageType'),
                                    formula: itemUtils.getConfig(workflow.item, 'formula')
                                }
                            }
                        }
                    };
                    effectUtils.addMacro(casterEffectData, 'midi.actor', ['bestowCurseDamage']);
                    effectUtils.addMacro(casterEffectData, 'effect', ['bestowCurse']);
                } else {
                    casterEffectData.flags['chris-premades'].bestowCurse.targets.push(targetToken.document.uuid);
                }
                if (!isNaN(duration)) casterEffectData.duration.seconds = duration;
                break;
            case 'Attack':
                targetEffectData.flags = {
                    'chris-premades': {
                        bestowCurse: {
                            sourceActor: workflow.actor.uuid
                        }
                    }
                };
                effectUtils.addMacro(targetEffectData, 'midi.actor', ['bestowCurseAttack']);
                break;
            case 'Turn': {
                let saveDC = itemUtils.getSaveDC(workflow.item);
                targetEffectData.changes = [
                    {
                        key: 'flags.midi-qol.OverTime',
                        mode: 0,
                        value: 'turn=start,saveAbility=wis,saveMagic=true,saveRemove=false,saveDC=' + saveDC + ',label="' + workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.turns.startOfTurn') + ')"',
                        priority: 20
                    }
                ];
                break;
            }
        }

        let targetEffectOptions = {
            identifier: 'bestowCurse' + selection
        };
        if (concentration) {
            casterEffectOptions.concentrationItem = workflow.item;
            if (selection !== 'Damage') targetEffectOptions.concentrationItem = workflow.item;
        }
        if (selection === 'Damage') targetEffectOptions.parentEntity = true;
        targetEffectsArray.push({
            targetEffectData,
            targetEffectOptions,
            targetToken
        });
    }
    if (concentration) casterEffectOptions.concentrationItem = workflow.item;
    let casterEffect;
    if (casterEffectData) casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, casterEffectOptions);
    for (let {targetEffectData, targetEffectOptions, targetToken} of targetEffectsArray) {
        if (casterEffect && targetEffectOptions.parentEntity) {
            targetEffectOptions.parentEntity = casterEffect;
        }
        effectUtils.addMacro(targetEffectData, 'effect', ['bestowCurse']);
        await effectUtils.createEffect(targetToken.actor, targetEffectData, targetEffectOptions);
    }
    if (concentration && !isNaN(duration)) {
        let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': duration});
    }
}
async function attack({workflow}) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseAttack');
    if (!effect) return;
    let sourceActorUuid = effect.flags['chris-premades'].bestowCurse.sourceActor;
    if (workflow.targets.map(target => target.actor?.uuid).has(sourceActorUuid)) {
        workflow.disadvantage = true;
        workflow.attackAdvAttribution.add('DIS:' + effect.name);
    }
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseSource');
    if (!effect) return;
    let {targets: validTargetUuids, damageType, formula} = effect.flags['chris-premades'].bestowCurse;
    if (!workflow.hitTargets.every(target => validTargetUuids.includes(target.document.uuid))) return;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
}
async function damageApplication({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'bestowCurseSource');
    if (!casterEffect) return;
    let {targets: validTargetUuids, damageType, formula} = casterEffect.flags['chris-premades'].bestowCurse;
    if (workflow.hitTargets.every(target => validTargetUuids.includes(target.document.uuid))) return;
    let extraDamageTargets = workflow.hitTargets.filter(target => validTargetUuids.includes(target.document.uuid));
    if (!extraDamageTargets.size) return;
    // TODO: apply damage only to those within extraDamageTargets
}
async function remove({entity}) {
    let originItem = await fromUuid(entity.origin);
    let sourceActor = originItem?.parent;
    if (!sourceActor) return;
    let identifier = effectUtils.getEffectIdentifier(entity);
    if (identifier === 'bestowCurseDamage') {
        let parentEffect = effectUtils.getEffectByIdentifier(sourceActor, 'bestowCurseSource');
        if (!parentEffect) return;
        let currDeps = parentEffect.getDependents();
        if (!currDeps.length) {
            await genericUtils.remove(parentEffect);
        } else {
            let currTargetsFlag = parentEffect.flags['chris-premades'].bestowCurse.targets;
            await genericUtils.setFlag(parentEffect, 'chris-premades', 'bestowCurse.targets', currTargetsFlag.filter(uuid => uuid !== actorUtils.getFirstToken(entity.parent)?.document?.uuid));
        }
    } else {
        let concEffect = effectUtils.getConcentrationEffect(sourceActor, originItem);
        if (!concEffect) return;
        let currDeps = concEffect.getDependents();
        if (!currDeps.length) {
            await genericUtils.remove(concEffect);
        }
    }
}
export let bestowCurse = {
    name: 'Bestow Curse',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
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
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'necrotic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }, {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
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
                // TODO: this ok rather than preAttackRoll?
                pass: 'preItemRoll',
                macro: attack,
                priority: 50
            }
        ]
    }
};
// TODO: caster preDamageApplication -> damageApplication as above
export let bestowCurseDamage = {
    name: 'Bestow Curse: Damage',
    version: bestowCurse.version,
    midi: {
        actor: [
            {
                pass: 'postDamageRoll',
                macro: damage,
                priority: 250
            }
        ]
    }
};