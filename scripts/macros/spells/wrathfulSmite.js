import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                wrathfulSmite: {
                    dc: itemUtils.getSaveDC(workflow.item),
                    used: false,
                    damageType: itemUtils.getConfig(workflow.item, 'damageType')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['wrathfulSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'wrathfulSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wrathfulSmite');
    if (!effect) return;
    if (effect.flags['chris-premades'].wrathfulSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'wrathfulSmite.used', true);
    let damageType = effect.flags['chris-premades'].wrathfulSmite.damageType;
    let formula = '1d6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Wrathful Smite: Frighten', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WrathfulSmite.Frighten'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.effects[0].duration.seconds = effect.duration.remaining;
    featureData.system.save.dc = effect.flags['chris-premades'].wrathfulSmite.dc;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.hitTargets.first()]);
    let targetEffect = featureWorkflow.failedSaves.first()?.actor?.appliedEffects?.find(currEffect => currEffect.origin === featureWorkflow._id);
    if (!targetEffect) {
        await genericUtils.remove(effect);
        return;
    }
    let updates = {
        origin: effect.origin
    };
    await genericUtils.update(targetEffect, updates);
    await effectUtils.addDependent(effect, [targetEffect]);
    await effectUtils.addDependent(targetEffect, [effect]);
}
export let wrathfulSmite = {
    name: 'Wrathful Smite',
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
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let wrathfulSmiteDamage = {
    name: 'Wrathful Smite: Damage',
    version: wrathfulSmite.version,
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