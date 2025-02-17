import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'huntersMarkMove', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let seconds;
    switch (workflowUtils.getCastLevel(workflow)) {
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
        name: genericUtils.translate('CHRISPREMADES.Macros.HuntersMark.Marked'),
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
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'huntersMark',
            activityIdentifier: 'huntersMarkMove'
        }], 
        identifier: 'huntersMark',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['huntersMarkMove'],
            favorite: true
        }
    });
    for (let i of workflow.targets) {
        if (i.actor) await effectUtils.createEffect(i.actor, targetEffectData, {parentEntity: casterEffect, identifier: 'huntersMarkMarked'});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
}
async function move({workflow}) {
    if (workflow.targets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let targetUuids = effect.flags['chris-premades'].huntersMark.targets;
    let targets = targetUuids.map(i => fromUuidSync(i)?.object).filter(i => i);
    let selection;
    if (targets.length) {
        if (targets.length > 1) {
            selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.HuntersMark.Select', targets, {skipDeadAndUnconscious: false});
            if (!selection) return;
            selection = selection[0];
        } else {
            selection = targets[0];
        }
    }
    if (selection?.actor) {
        let effect = effectUtils.getEffectByIdentifier(selection.actor, 'huntersMarkMarked');
        if (effect) await genericUtils.remove(effect);
    }
    targetUuids = targetUuids.filter(i => i !== selection?.document.uuid);
    targetUuids.push(workflow.targets.first().document.uuid);
    await genericUtils.setFlag(effect, 'chris-premades', 'huntersMark.targets', targetUuids);
    let seconds = effect.duration.remaining;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.HuntersMark.Marked'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {parentEntity: effect, identifier: 'huntersMarkMarked'});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'huntersMark');
    if (!effect) return;
    let {targets: validTargetUuids, formula} = effect.flags['chris-premades'].huntersMark;
    if (!validTargetUuids.includes(workflow.hitTargets.first().document.uuid)) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let huntersMark = {
    name: 'Hunter\'s Mark',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['huntersMark']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['huntersMarkMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['huntersMarkMove']
            }
        ]
    },
    config: [
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