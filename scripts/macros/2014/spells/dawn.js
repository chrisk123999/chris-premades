import {crosshairUtils} from '../../../lib/utilities/crosshairUtils.js';
import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';

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
                    template: ['dawnShining']
                }
            }
        }
    });
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dawnMove', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                dawn: {
                    templateUuid: template.uuid
                },
                castData: workflow.castData
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'dawn', 
            activityIdentifier: 'dawnMove'
        }],
        identifier: 'dawn',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dawnMove'],
            favorite: true
        }
    });
}
async function move({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dawn');
    let template = await fromUuid(effect?.flags['chris-premades'].dawn.templateUuid);
    if (!template) return;
    await workflow.actor.sheet.minimize();
    let position = await crosshairUtils.aimCrosshair({token: workflow.token, maxRange: genericUtils.convertDistance(60), centerpoint: template.object.center, crosshairsConfig: {icon: effect.img, resolution: 2, size: template.distance}, drawBoundries: true});
    await workflow.actor.sheet.maximize();
    if (position.cancelled) return;
    await genericUtils.update(template, {
        x: position.x ?? template.x,
        y: position.y ?? template.y
    });
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'dawnEndTurn', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [token], {atLevel: castData.castLevel});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let dawn = {
    name: 'Dawn',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['dawn']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['dawnMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['dawnMove']
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