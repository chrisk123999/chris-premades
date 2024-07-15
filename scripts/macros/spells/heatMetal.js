import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (workflow.targets.size !== 1) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let targetToken = workflow.targets.first();
    let targetUuid = targetToken.document.uuid;
    let damageFormula = workflow.castData.castLevel + 'd8[fire]';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Pulse', {getDescription: true, translate: 'CHRISPREMADES.macros.heatMetal.pulse', object: true});
    let spellDC = itemUtils.getSaveDC(workflow.item);
    featureData.flags['chris-premades'] = {
        heatMetal: {
            damageFormula,
            targetUuid,
            spellDC
        },
        macros: {
            'midi.item': ['heatMetalPulse']
        },
        spell: {
            castData: workflow.castData
        }
    };
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
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
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'heatMetal', vae: {button: featureData.name}});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'heatMetalPulse'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': casterEffectData.duration.seconds});
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.heatMetal.dialog'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 6
        },
        flags: {
            'chris-premades': {
                heatMetal: {
                    spellDC
                }
            }
        }
    };
    effectUtils.addMacro(targetEffectData, 'effect', ['heatMetalDialog']);
    await effectUtils.createEffect(targetToken.actor, targetEffectData, {parentEntity: effect});
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
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Damage', {getDescription: true, translate: 'CHRISPREMADES.macros.heatMetal.damage', object: true});
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
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.heatMetal.dialog'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 6
        },
        flags: {
            'chris-premades': {
                heatMetal: {
                    spellDC
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['heatMetalDialog']);
    await effectUtils.createEffect(targetToken.actor, effectData, {parentEntity: parentEffect});
}
async function dialog({trigger: {entity: originEffect}}) {
    let originItem = await fromUuid(originEffect.origin);
    let targetActor = originEffect.parent;
    let targetToken = actorUtils.getFirstToken(targetActor);
    let selection = await dialogUtils.buttonDialog(originEffect.name, 'CHRISPREMADES.macros.heatMetal.drop', [['CHRISPREMADES.Generic.Yes', true], ['CHRISPREMADES.Generic.No', false], ['CHRISPREMADES.macros.heatMetal.unable', 'unable']]);
    if (selection) {
        await genericUtils.remove(originEffect);
        return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Heat Metal: Held', {getDescription: true, translate: 'CHRISPREMADES.macros.heatMetal.held', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let spellDC = originEffect.flags['chris-premades']?.heatMetal?.spellDC;
    if (!spellDC) return;
    featureData.system.save.dc = spellDC;
    let heatMetalWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, originItem.parent, [targetToken]);
    if (heatMetalWorkflow.failedSaves.size !== 0 && selection !== 'unable') {
        await genericUtils.remove(originEffect);
        return;
    }
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.heatMetal.held'),
        img: originItem.img,
        origin: originEffect.origin,
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
    await effectUtils.createEffect(targetActor, effectData, {concentrationItem: originItem, identifier: 'heatMetalHeld'});
    await genericUtils.remove(originEffect);
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
export let heatMetalDialog = {
    name: 'Heat Metal: Dialog',
    version: heatMetal.version,
    effect: [
        {
            pass: 'created',
            macro: dialog,
            priority: 50
        }
    ]
};