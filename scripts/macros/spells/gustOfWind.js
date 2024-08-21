import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let token = workflow.token;
    let template = workflow.template;
    if (!template || !token) {
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
                    template: ['gustOfWindGust']
                }
            }
        }
    });
    await tokenUtils.attachToToken(token, [template.uuid]);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Gust of Wind: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GustOfWind.Move', identifier: 'gustOfWindMove'});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                gustOfWind: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'gustOfWindMove'}], identifier: 'gustOfWind'});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'gustOfWind');
    let template = await fromUuid(effect?.flags['chris-premades'].gustOfWind.templateUuid);
    let newTemplate = workflow.template;
    if (!template || !newTemplate) return;
    await genericUtils.update(template, {
        x: newTemplate.x,
        y: newTemplate.y,
        direction: newTemplate.direction
    });
    await genericUtils.remove(newTemplate);
}
async function startTurn({trigger: {entity: template, castData, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Gust of Wind: Push', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GustOfWind.Push', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
    if (!featureWorkflow.failedSaves.size) return;
    let gustAngle = template.object.ray.angle;
    let ray = Ray.fromAngle(token.center.x, token.center.y, gustAngle, canvas.dimensions.size);
    await tokenUtils.moveTokenAlongRay(token, ray, 15);
}
export let gustOfWind = {
    name: 'Gust of Wind',
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
export let gustOfWindMove = {
    name: 'Gust of Wind: Move',
    version: gustOfWind.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50
            }
        ]
    }
};
export let gustOfWindGust = {
    name: 'Gust of Wind: Gust',
    version: gustOfWind.version,
    template: [
        {
            pass: 'turnStart',
            macro: startTurn,
            priority: 50
        }
    ]
};