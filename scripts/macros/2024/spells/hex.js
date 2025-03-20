import {constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils, activityUtils} from '../../../utils.js';
import { hex as hexLegacy } from '../../../legacyMacros.js';
async function use({trigger, workflow}) {
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
    switch (workflowUtils.getCastLevel(workflow)) {
        case 2:
            seconds = 14400;
            break;
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
}
export let hex = {
    name: 'Hex',
    version: '1.2.29',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['hex']
            },
            ...hexLegacy.midi.item.slice(1)
        ]
    },
    config: hexLegacy.config
};