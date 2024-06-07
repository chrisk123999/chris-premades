import {constants, errors, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils, actorUtils} from '../../utils.js';
async function use(workflow) {
    if (!workflow.targets.size) return;
    let buttons = Object.values(CONFIG.DND5E.abilities).map(i => [i.label, i.abbreviation]);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.hex.selectAbility', buttons);
    if (!selection) return;
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
        name: genericUtils.translate('CHRISPREMADES.macros.hex.hexed'),
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.' + selection,
                mode: 0,
                value: true,
                priority: 20
            }
        ]
    };
    let casterEffectData = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        },
        flags: {
            'chris-premades': {
                hex: {
                    targets: Array.from(workflow.targets).map(i => i.document.uuid),
                    damageType: itemUtils.getConfig(workflow.item, 'damageType'),
                    formula: itemUtils.getConfig(workflow.item, 'formula'),
                    ability: selection
                }
            }
        }
    };
    effectUtils.addMacro(casterEffectData, 'midi.actor', ['hexAttack']);
    let featureData = await itemUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hex: Move', {getDescription: true, translate: true, identifier: 'hexMove'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, identifier: 'hex', vae: {button: featureData.name}});
    for (let i of workflow.targets) {
        if (i.actor) await effectUtils.createEffect(i.actor, targetEffectData, {parentEntity: casterEffect, identifier: 'hexed'});
    }
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: casterEffect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
}
async function damage(workflow) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hex');
    if (!effect) return;
    let validTargetUuids = effect.flags['chris-premades'].hex.targets;
    if (!workflow.hitTargets.find(i => validTargetUuids.includes(i.document.uuid))) return;
    let damageType = effect.flags['chris-premades'].hex.damageType;
    let formula = effect.flags['chris-premades'].hex.formula;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
}
async function move(workflow) {
    if (workflow.targets.size != 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hex');
    if (!effect) return;
    let oldTargets = effect.flags['chris-premades'].hex.targets;
    let targets = (await Promise.all(oldTargets.map(async i => await fromUuid(i)))).filter(j => j);
    let selection;
    if (targets.length) {
        if (targets.length > 1) {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.macros.hex.multiple', targets, {skipDeadAndUnconscious: false});
            if (!selection) {
                selection = targets[0];
            }
        } else {
            selection = targets[0];
        }
    }
    if (selection.actor) {
        let effect = effectUtils.getEffectByIdentifier(selection.actor, 'hexed');
        if (effect) await genericUtils.remove(effect);  //Here
    }
    oldTargets = oldTargets.filter(i => i != selection.uuid);
    oldTargets.push(workflow.targets.first().uuid);
    await genericUtils.setFlag(effect, 'chris-premades', 'hex.targets', oldTargets);
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.hex.hexed'),
        icon: effect.icon,
        origin: effect.origin,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.' + effect.flags['chris-premades'].hex.ability,
                mode: 0,
                value: true,
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {parentEntity: effect, identifier: 'hexed'});

}
export let hex = {
    name: 'Hex',
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
    config: [
        {
            value: 'damageType',
            type: 'select',
            default: 'necrotic',
            options: dialogUtils.damageTypeOptions,
            homebrew: true
        },
        {
            value: 'formula',
            type: 'text',
            default: '1d6',
            homebrew: true
        }
    ]
};
export let hexMove = {
    name: 'Hex - Move',
    version: hex.version,
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: move,
                priority: 50
            }
        ]
    }
};
export let hexAttack = {
    name: 'Hex - Attack',
    version: hex.version,
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