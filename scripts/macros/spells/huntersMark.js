import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
// TODO: see about twinning like hex
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hunter\'s Mark: Move', {getDescription: true, translate: 'CHRISPREMADES.macros.huntersMark.move', identifier: 'huntersMarkMove', object: true});
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
    let durationScale = workflow.item.system.duration.value;
    seconds = Math.min(seconds * durationScale, 86400);
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.huntersMark.marked'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        }
    };
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
                    targets: Array.from(workflow.targets).map(i => i.document.uuid),
                    formula: itemUtils.getConfig(workflow.item, 'formula')
                }
            }
        }
    };
    effectUtils.addMacro(casterEffectData, 'midi.actor', ['huntersMarkSource']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'huntersMarkMove'}], identifier: 'huntersMark'});
    for (let i of workflow.targets) {
        if (i.actor) await effectUtils.createEffect(i.actor, targetEffectData, {parentEntity: casterEffect, identifier: 'huntersMarkMarked'});
    }
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: casterEffect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let {targets: validTargetUuids, formula} = effect.flags['chris-premades'].huntersMark;
    if (!validTargetUuids.includes(workflow.hitTargets.first().document.uuid)) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, formula + '[' + damageType + ']', {damageType});
}
async function move({workflow}) {
    if (workflow.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let targetUuids = effect.flags['chris-premades'].huntersMark.targets;
    let targets = (await Promise.all(targetUuids.map(async i => await fromUuid(i)))).filter(j => j).map(k => k.object);
    let selection;
    if (targets.length) {
        if (targets.length > 1) {
            selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.macros.huntersMark.select', targets, {skipDeadAndUnconscious: false});
            if (!selection) return;
            selection = selection[0];
        } else {
            selection = targets[0];
        }
    }
    if (selection.actor) {
        let effect = effectUtils.getEffectByIdentifier(selection.actor, 'huntersMarkMarked');
        if (effect) await genericUtils.remove(effect);
    }
    targetUuids = targetUuids.filter(i => i !== selection.document.uuid);
    targetUuids.push(workflow.targets.first().document.uuid);
    await genericUtils.setFlag(effect, 'chris-premades', 'huntersMark.targets', targetUuids);
    let seconds = effect.duration.remaining;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.huntersMark.marked'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {parentEntity: effect, identifier: 'huntersMarkMarked'});
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