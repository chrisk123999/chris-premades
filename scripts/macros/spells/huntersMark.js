import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
// TODO: see about twinning like hex
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (workflow.targets.size !== 1) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hunter\'s Mark: Move', {getDescription: true, translate: 'CHRISPREMADES.macros.huntersMark.move', object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let seconds;
    switch (workflow.castData.castLevel) {
        case 3:
        case 4:
            seconds = 28800;
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            seconds = 86400;
            break;
        default:
            seconds = 3600;
    }
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.huntersMark.marked'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        }
    };
    effectUtils.addMacro(targetEffectData, 'midi.actor', ['huntersMarkMarked']);
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        },
        flags: {
            'chris-premades': {
                huntersMark: {
                    markedTargetId: workflow.targets.first().id,
                    formula: itemUtils.getConfig(workflow.item, 'formula')
                }
            }
        }
    };
    effectUtils.addMacro(casterEffectData, 'midi.actor', ['huntersMarkSource']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: {button: featureData.name}, identifier: 'huntersMark'});
    await effectUtils.createEffect(workflow.targets.first().actor, targetEffectData, {parentEntity: casterEffect, identifier: 'huntersMarkMarked'});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: casterEffect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let {markedTargetId, formula} = effect.flags['chris-premades'].huntersMark;
    if (workflow.hitTargets.first().id !== markedTargetId) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, formula + '[' + damageType + ']', {damageType});
}
async function damageApplication({workflow, ditem}) {
    if (workflow.hitTargets.size === 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!casterEffect) return;
    let {markedTargetId, formula} = casterEffect.flags['chris-premades'].huntersMark;
    let targetToken = workflow.hitTargets.find(target => markedTargetId === target.id);
    if (!targetToken) return;
    let damageType = workflow.defaultDamageType;
    let damageRoll = await new CONFIG.Dice.DamageRoll(formula + '[' + damageType + ']', workflow.actor.getRollData()).evaluate();
    genericUtils.setProperty(damageRoll, 'options.type', damageType);
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: workflow.chatCard.speaker,
        flavor: genericUtils.translate('CHRISPREMADES.macros.huntersMark.damageFlavor')
    });
    let hasDI = actorUtils.checkTrait(targetToken.actor, 'di', damageType);
    if (hasDI) return;
    let damageTotal = damageRoll.total;
    let trueDamageTotal = damageTotal;
    let hasDR = actorUtils.checkTrait(targetToken.actor, 'dr', damageType);
    if (hasDR) damageTotal = Math.floor(damageTotal / 2);
    let hasDV = actorUtils.checkTrait(targetToken.actor, 'dv', damageType);
    if (hasDV) damageTotal *= 2;
    let remainingDamage = damageTotal - Math.min(ditem.newTempHP, damageTotal);
    ditem.newTempHP -= (damageTotal - remainingDamage);
    ditem.tempDamage += (damageTotal - remainingDamage);
    ditem.totalDamage += trueDamageTotal;
    ditem.appliedDamage += damageTotal;
    ditem.hpDamage += remainingDamage;
    ditem.newHP = Math.max(0, ditem.newHP - remainingDamage);
}
async function move({workflow}) {
    if (workflow.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let oldTargetTokenId = effect.flags['chris-premades']?.huntersMark?.markedTargetId;
    let oldTargetToken = canvas.scene.tokens.get(oldTargetTokenId);
    if (oldTargetToken) {
        let oldTargetActor = oldTargetToken.actor;
        let oldTargetEffect = effectUtils.getEffectByIdentifier(oldTargetActor, 'huntersMarkMarked');
        if (oldTargetEffect) await genericUtils.remove(oldTargetEffect);
    }
    let seconds = effect.duration.remaining;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.huntersMark.marked'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['huntersMarkMarked']);
    await effectUtils.createEffect(targetActor, effectData, {parentEntity: effect, identifier: 'huntersMarkMarked'});
    await genericUtils.update(effect, {'flags.chris-premades.huntersMark.markedTargetId': targetToken.id});
}
export let huntersMark = {
    name: 'Hunter\'s Mark',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '1d6',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let huntersMarkSource = {
    name: 'Hunter\'s Mark (source)',
    version: huntersMark.version,
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
export let huntersMarkMarked = {
    name: 'Hunter\'s Mark: Marked',
    version: huntersMark.version,
    midi: {
        actor: [
            {
                pass: 'applyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};
export let huntersMarkMove = {
    name: 'Hunter\'s Mark: Move',
    version: huntersMark.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50
            }
        ]
    }
};