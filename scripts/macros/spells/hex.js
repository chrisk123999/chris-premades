import {constants, errors, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils, compendiumUtils, activityUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier === genericUtils.getIdentifier(workflow.item)) {
        let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (!workflow.targets.size) {
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        let buttons = Object.values(CONFIG.DND5E.abilities).map(i => [i.label, i.abbreviation]);
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Hex.SelectAbility', buttons);
        if (!selection) {
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
            name: genericUtils.translate('CHRISPREMADES.Macros.Hex.Hexed'),
            img: workflow.item.img,
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
            img: workflow.item.img,
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
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'hexMove', {strict: true});
        if (!feature) {
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
            concentrationItem: workflow.item, 
            identifier: 'hex', 
            vae: [{
                type: 'use', 
                name: feature.name,
                identifier: 'hex', 
                activityIdentifier: 'hexMove'
            }],
            unhideActivities: {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['hexMove'],
                favorite: true
            }
        });
        for (let i of workflow.targets) {
            if (i.actor) await effectUtils.createEffect(i.actor, targetEffectData, {parentEntity: casterEffect, identifier: 'hexed'});
        }
        if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
    } else if (activityIdentifier === 'hexMove') {
        if (workflow.targets.size != 1) return;
        let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hex');
        if (!effect) return;
        let oldTargets = effect.flags['chris-premades'].hex.targets;
        let targets = oldTargets.map(i => fromUuidSync(i)?.object).filter(i => i);
        let selection;
        if (targets.length) {
            if (targets.length > 1) {
                selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Hex.Multiple', targets, {skipDeadAndUnconscious: false});
                if (!selection) {
                    selection = targets[0];
                }
            } else {
                selection = targets[0];
            }
        }
        if (selection.actor) {
            let effect = effectUtils.getEffectByIdentifier(selection.actor, 'hexed');
            if (effect) await genericUtils.remove(effect);
        }
        oldTargets = oldTargets.filter(i => i != selection.document.uuid);
        oldTargets.push(workflow.targets.first().document.uuid);
        await genericUtils.setFlag(effect, 'chris-premades', 'hex.targets', oldTargets);
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.Hex.Hexed'),
            img: effect.img,
            origin: effect.uuid,
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
}
async function damage({trigger, workflow}) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hex');
    if (!effect) return;
    let validTargetUuids = effect.flags['chris-premades'].hex.targets;
    if (!workflow.hitTargets.find(i => validTargetUuids.includes(i.document.uuid))) return;
    let damageType = effect.flags['chris-premades'].hex.damageType;
    let formula = effect.flags['chris-premades'].hex.formula;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
}
async function early({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'hexMove') return;
    workflowUtils.skipDialog(workflow);
}
export let hex = {
    name: 'Hex',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    },
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
            default: '1d6',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let hexAttack = {
    name: 'Hex - Attack',
    version: hex.version,
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