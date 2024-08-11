import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
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
                thunderousSmite: {
                    dc: itemUtils.getSaveDC(workflow.item),
                    damageType: itemUtils.getConfig(workflow.item, 'damageType')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['thunderousSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'thunderousSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'thunderousSmite');
    if (!effect) return;
    let damageType = effect.flags['chris-premades'].thunderousSmite.damageType;
    let formula = '2d6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Thunderous Smite: Push', {object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.save.dc = effect.flags['chris-premades'].thunderousSmite.dc;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.hitTargets.first()]);
    if (featureWorkflow.failedSaves.size) {
        let targetToken = workflow.targets.first();
        await tokenUtils.pushToken(workflow.token, targetToken, 10);
        if (!actorUtils.checkTrait(targetToken.actor, 'ci', 'prone')) {
            effectUtils.applyConditions(targetToken.actor, ['prone']);
        }
    }
    await genericUtils.remove(effect);
}
export let thunderousSmite = {
    name: 'Thunderous Smite',
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
            default: 'thunder',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let thunderousSmiteDamage = {
    name: 'Thunderous Smite: Damage',
    version: thunderousSmite.version,
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