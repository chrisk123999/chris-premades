import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (workflow.targets.size !== 1) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let targetToken = workflow.targets.first();
    let targetUuid = targetToken.document.uuid;
    let damageFormula = workflow.castData.castLevel + 'd8[fire]';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Pulse', {getDescription: true, translate: 'CHRISPREMADES.Macros.HeatMetal.Pulse', identifier: 'heatMetalPulse', castDataWorkflow: workflow, object: true});
    let spellDC = itemUtils.getSaveDC(workflow.item);
    await genericUtils.setProperty(featureData, 'flags.chris-premades.heatMetal', {
        damageFormula,
        targetUuid,
        spellDC
    });
    effectUtils.addMacro(featureData, 'midi.item', ['heatMetalPulse']);
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                heatMetal: {
                    targetUuid
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'heatMetal', vae: [{type: 'use', name: featureData.name, identifier: 'heatMetalPulse'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': casterEffectData.duration.seconds});
    await dialog(workflow, spellDC, targetToken, effect);
}
async function pulse({workflow}) {
    let chrisFlags = workflow.item.flags['chris-premades']?.heatMetal;
    let damageFormula = chrisFlags?.damageFormula;
    let targetTokenUuid = chrisFlags?.targetUuid;
    let spellDC = chrisFlags?.spellDC;
    let parentEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'heatMetal');
    if (!damageFormula || !targetTokenUuid || !spellDC || !parentEffect) return;
    let targetToken = (await fromUuid(targetTokenUuid))?.object;
    if (!targetToken) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Damage', {getDescription: true, translate: 'CHRISPREMADES.Macros.HeatMetal.Damage', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts = [
        [
            damageFormula,
            'fire'
        ]
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
    await dialog(workflow, spellDC, targetToken, parentEffect);
}
async function dialog(workflow, spellDC, targetToken, parentEffect) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.HeatMetal.Drop', [['CHRISPREMADES.Generic.Yes', true], ['CHRISPREMADES.Generic.No', false], ['CHRISPREMADES.Macros.HeatMetal.Unable', 'unable']], {userId: socketUtils.firstOwner(targetToken.actor, true)});
    if (selection) {
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Held', {getDescription: true, translate: 'CHRISPREMADES.Macros.HeatMetal.Held', object: true, flatDC: spellDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let heatMetalWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
    if (heatMetalWorkflow.failedSaves.size !== 0 && selection !== 'unable') {
        return;
    }
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.HeatMetal.Held'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 6
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                value: 1,
                mode: 0,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.all',
                value: 1,
                mode: 0,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource'
                ],
            }
        }
    };
    await effectUtils.createEffect(targetToken.actor, effectData, {concentrationItem: parentEffect, identifier: 'heatMetalHeld'});
}
export let heatMetal = {
    name: 'Heat Metal',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let heatMetalPulse = {
    name: 'Heat Metal: Pulse',
    verison: heatMetal.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: pulse,
                priority: 50
            }
        ]
    }
};