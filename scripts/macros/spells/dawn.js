import {crosshairUtils} from '../../lib/utilities/crosshairUtils.js';
import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

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
                castData: workflow.castData,
                macros: {
                    template: ['dawnShining']
                }
            }
        }
    });
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Dawn: Move', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.dawn.move', identifier: 'dawnMove'});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await effectUtils.addMacro(featureData, 'midi.item', ['dawnMove']);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                dawn: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'dawnMove'}], identifier: 'dawn'});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dawn');
    let template = await fromUuid(effect?.flags['chris-premades'].dawn.templateUuid);
    if (!template) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({token: workflow.token, maxRange: 60, centerpoint: template.object.center, crosshairsConfig: {icon: effect.img, resolution: 2, size: template.distance}, drawBoundries: true});
    await workflow.actor.sheet.maximize();
    if (position.cancelled) return;
    await genericUtils.update(template, {
        x: position.x ?? template.x,
        y: position.y ?? template.y
    });
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Dawn: End Turn', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.dawn.endTurn', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await fromUuid(template.flags.dnd5e?.origin))?.parent ?? token.actor;
    await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}
export let dawn = {
    name: 'Dawn',
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
export let dawnMove = {
    name: 'Dawn: Move',
    version: dawn.version,
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
export let dawnShining = {
    name: 'Dawn: Shining',
    version: dawn.version,
    template: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        }
    ]
};