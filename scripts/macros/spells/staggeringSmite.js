import { compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils } from "../../utils.js";

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60
        },
        flags: {
            'chris-premades': {
                staggeringSmite: {
                    dc: itemUtils.getSaveDC(workflow.item)
                }
            }
        }
    }
    effectUtils.addMacro(effectData, 'midi.actor', ['staggeringSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'staggeringSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await genericUtils.update(concentrationEffect, {'duration.seconds': 60});
}

async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'staggeringSmite');
    if (!effect) return;
    let damageType = 'psychic';
    let formula = '4d6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Staggering Smite: Stagger', {object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.save.dc = effect.flags['chris-premades'].staggeringSmite.dc;
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.hitTargets.first()]);
    await genericUtils.remove(effect);
}

export let staggeringSmite = {
    name: 'Staggering Smite',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};

export let staggeringSmiteDamage = {
    name: 'Staggering Smite: Damage',
    version: staggeringSmite.version,
    midi: {
        actor: [
            {
                pass: 'postDamageRoll',
                macro: damage,
                priority: 250
            }
        ]
    }
}