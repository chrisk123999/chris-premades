import {animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['stormSphereTemplate']
                }
            }
        }
    });
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Storm Sphere: Bolt', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.StormSphere.Bolt', identifier: 'stormSphereBolt', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let castLevel = workflow.castData.castLevel ?? 4;
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            castLevel + 'd6[' + damageType + ']',
            damageType
        ]
    ];
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                stormSphere: {
                    templateUuid: template.uuid,
                    alreadyIgnores: workflow.actor.flags['midi-qol']?.ignoreNearbyFoes ?? false,
                    playAnimation: itemUtils.getConfig(workflow.item, 'playAnimation')
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'stormSphere', vae: [{type: 'use', name: featureData.name, identifier: 'stormSphereBolt'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Storm Sphere: Turn', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.StormSphere.Turn', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts = [
        [
            (castData.castLevel - 2) + 'd6[bludgeoning]',
            'bludgeoning'
        ]
    ];
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
async function early({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'stormSphere');
    if (!effect) return;
    let {templateUuid, alreadyIgnores} = effect.flags['chris-premades'].stormSphere;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    if (!alreadyIgnores) await genericUtils.setFlag(workflow.actor, 'midi-qol', 'ignoreNearbyFoes', 1);
    if (!templateUtils.getTokensInTemplate(template).has(targetToken)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'stormSphere');
    if (!effect) return;
    let {templateUuid, alreadyIgnores, playAnimation} = effect.flags['chris-premades'].stormSphere;
    if (!alreadyIgnores) await genericUtils.setFlag(workflow.actor, 'midi-qol', 'ignoreNearbyFoes', 0);
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = workflow.targets.first();
    new Sequence().effect().atLocation(template.object).stretchTo(targetToken).file('jb2a.chain_lightning.primary.blue').missed(!workflow.hitTargets.has(targetToken)).play();
}
export let stormSphere = {
    name: 'Storm Sphere',
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'lightning',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let stormSphereBolt = {
    name: 'Storm Sphere: Bolt',
    version: stormSphere.version,
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50
            }
        ]
    }
};
export let stormSphereTemplate = {
    name: 'Storm Sphere: Template',
    version: stormSphere.version,
    template: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        }
    ]
};