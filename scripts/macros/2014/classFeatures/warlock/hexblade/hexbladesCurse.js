import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hexbladesCurse');
    if (!effect) return;
    let targetId = effect.flags['chris-premades'].hexbladesCurse.target;
    let targetToken = workflow.hitTargets.first();
    if (targetId !== targetToken.id) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, '@prof', {damageType});
}
async function damageApplication({trigger: {token}, workflow, ditem}) {
    if (workflow.hitTargets.size === 1) return;
    let sourceEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'hexbladesCurse');
    if (!sourceEffect) return;
    let targetId = sourceEffect.flags['chris-premades'].hexbladesCurse.target;
    if (targetId !== token.id) return;
    let rawDamage = workflow.actor.system.attributes.prof;
    ditem.rawDamageDetail[0].value += rawDamage;
    let modifiedDamage = rawDamage * ditem.damageDetail[0].active.multiplier ?? 1;
    ditem.damageDetail[0].value += modifiedDamage;
    ditem.hpDamage += modifiedDamage;
}
async function early({workflow}) {
    if (workflow.targets.size !== 1 || !constants.attacks.includes(workflowUtils.getActionType(workflow))) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hexbladesCurse');
    if (!effect) return;
    let targetId = effect.flags['chris-premades'].hexbladesCurse.target;
    let targetToken = workflow.hitTargets.first();
    if (targetId !== targetToken.id) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.GenericEffects.CriticalThreshold'),
        img: constants.tempConditionIcon,
        changes: [
            {
                key: 'flags.midi-qol.grants.criticalThreshold',
                value: 19,
                mode: 5,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isAttacked'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(targetToken.actor, effectData);
}
async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let sourceEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            dae: {
                specialDuration: [
                    'zeroHP'
                ]
            }
        }
    };
    let targetEffectData = genericUtils.duplicate(sourceEffectData);
    targetEffectData.name += ': ' + genericUtils.translate('DND5E.Target');
    genericUtils.setProperty(sourceEffectData, 'flags.chris-premades.hexbladesCurse.target', workflow.targets.first().id);
    effectUtils.addMacro(sourceEffectData, 'midi.actor', ['hexbladesCurseSource']);
    effectUtils.addMacro(targetEffectData, 'midi.actor', ['hexbladesCurseTarget']);
    effectUtils.addMacro(targetEffectData, 'effect', ['hexbladesCurseTarget']);
    let effect = await effectUtils.createEffect(workflow.actor, sourceEffectData, {identifier: 'hexbladesCurse'});
    await effectUtils.createEffect(workflow.targets.first().actor, targetEffectData, {parentEntity: effect, identifier: 'hexbladesCurseTarget'});
}
async function remove({trigger: {entity: effect}}) {
    if (effect.parent?.system.attributes.hp.value) return;
    let originItem = await effectUtils.getOriginItem(effect);
    let originActor = originItem?.parent;
    if (!originActor) return;
    let sourceEffect = effectUtils.getEffectByIdentifier(originActor, 'hexbladesCurse');
    let masterOfHexes = itemUtils.getItemByIdentifier(originActor, 'masterOfHexes');
    let useHeal = true;
    let targetToken;
    let originToken = actorUtils.getFirstToken(originActor);
    if (masterOfHexes && originToken && !effectUtils.getEffectByStatusID(originActor, 'incapacitated')) {
        let targets = tokenUtils.findNearby(originToken, 30, 'enemy', {includeIncapacitated: false});
        targets = targets.filter(i => tokenUtils.canSee(originToken, i));
        if (targets.length) {
            let selection = await dialogUtils.selectTargetDialog(masterOfHexes.name, 'CHRISPREMADES.Macros.HexbladesCurse.Transfer', targets, {skipDeadAndUnconscious: true, userId: socketUtils.firstOwner(originActor, true), buttons: 'yesNo'});
            if (selection?.length) {
                useHeal = false;
                targetToken = selection[0];
            }
        }
    }
    if (useHeal) {
        let feature = activityUtils.getActivityByIdentifier(originItem, 'hexbladesCurseHealing', {strict: true});
        if (!feature) return;
        await workflowUtils.syntheticActivityRoll(feature, []);
        if (sourceEffect) await genericUtils.remove(sourceEffect);
    } else {
        let effectData = {
            name: effect.name,
            img: effect.img,
            origin: effect.origin,
            duration: {
                seconds: effect.duration.remaining
            },
            flags: {
                dae: {
                    specialDuration: [
                        'zeroHP'
                    ]
                }
            }
        };
        effectUtils.addMacro(effectData, 'midi.actor', ['hexbladesCurseTarget']);
        effectUtils.addMacro(effectData, 'effect', ['hexbladesCurseTarget']);
        await genericUtils.setFlag(sourceEffect, 'chris-premades', 'hexbladesCurse.target', targetToken.id);
        await effectUtils.createEffect(targetToken.actor, effectData, {parentEntity: sourceEffect, identifier: 'hexbladesCurseTarget'});
    }
}
export let hexbladesCurse = {
    name: 'Hexblade\'s Curse',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['hexbladesCurse']
            }
        ]
    }
};
export let hexbladesCurseSource = {
    name: 'Hexblade\'s Curse: Source',
    version: hexbladesCurse.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};
export let hexbladesCurseTarget = {
    name: 'Hexblade\'s Curse: Target',
    version: hexbladesCurse.version,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};