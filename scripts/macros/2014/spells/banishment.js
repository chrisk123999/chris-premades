import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.failedSaves.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Banishment.PlaneSelect', workflow.failedSaves, {type: 'multiple', skipDeadAndUnconscious: false, userId: socketUtils.gmID(), maxAmount: workflow.failedSaves.size});
    if (!selection) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let otherPlanarTokens = selection[0] ?? [];
    await banishmentHelper(workflow, otherPlanarTokens);
}
export async function banishmentHelper(workflow, otherPlanarTokens = []) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            }, 
            {
                key: 'system.attributes.ac.bonus',
                mode: 5,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 5,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'spectral-body',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'effect', ['banishmentBanished']);
    for (let token of workflow.failedSaves) {
        let trueEffectData;
        if (otherPlanarTokens.includes(token)) {
            trueEffectData = effectData;
        } else {
            trueEffectData = genericUtils.duplicate(effectData);
            genericUtils.setProperty(trueEffectData, 'flags.chris-premades.banishment.samePlane', true);
            genericUtils.setProperty(trueEffectData, 'flags.chris-premades.conditions', ['incapacitated']);
        }
        await effectUtils.createEffect(token.actor, trueEffectData, {concentrationItem: workflow.item, identifier: 'banishmentBanished'});
    }
}
async function remove({trigger: {entity}}) {
    let effect = entity;
    let actor = effect.parent;
    if (!actor) return;
    let token = actorUtils.getFirstToken(actor);
    if (!token) return;
    if (effect.flags['chris-premades']?.banishment?.samePlane || effect.duration.remaining !== 0) return;
    await genericUtils.update(token.document, {hidden: true});
}
export let banishment = {
    name: 'Banishment',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            }
        ]
    }
};
export let banishmentBanished = {
    name: 'Banishment: Banished',
    version: banishment.version,
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};