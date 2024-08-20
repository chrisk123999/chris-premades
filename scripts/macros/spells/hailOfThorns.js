import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                hailOfThorns: {
                    castLevel: workflow.castData?.castLevel ?? 1,
                    dc: itemUtils.getSaveDC(workflow.item),
                    damageType: itemUtils.getConfig(workflow.item, 'damageType'),
                    school: workflow.item.system.school
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['hailOfThornsBurst']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'hailOfThornsBurst'});
    if (concentrationEffect) genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.item?.system?.actionType !== 'rwak') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hailOfThornsBurst');
    if (!effect) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Hail of Thorns: Burst', {getDescription: true, translate: 'CHRISPREMADES.Macros.HailOfThorns.Burst', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    genericUtils.setProperty(featureData, 'flags.chris-premades.castData.school', effect.flags['chris-premades'].hailOfThorns.school);
    let damageDice = Math.min(effect.flags['chris-premades']?.hailOfThorns?.castLevel ?? 1, 6);
    let damageType = effect.flags['chris-premades']?.hailOfThorns?.damageType;
    featureData.system.damage.parts = [
        [
            damageDice + 'd10[' + damageType + ']',
            damageType
        ]
    ];
    let saveDC = effect.flags['chris-premades']?.hailOfThorns?.dc ?? 10;
    featureData.system.save.dc = saveDC;
    let targetToken = workflow.targets.first();
    let allTargets = tokenUtils.findNearby(targetToken, 5).concat(targetToken);
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, allTargets);
    await genericUtils.remove(effect);
}
export let hailOfThorns = {
    name: 'Hail of Thorns',
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
            default: 'piercing',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let hailOfThornsBurst = {
    name: 'Hail of Thorns: Burst',
    version: hailOfThorns.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};