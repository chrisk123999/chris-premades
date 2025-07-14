import {activityUtils, effectUtils, genericUtils, itemUtils, templateUtils, tokenUtils, workflowUtils} from '../../../utils.js';

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
                rules: 'modern',
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['gustOfWindGust']
                }
            }
        }
    });
    await tokenUtils.attachToToken(token, [template.uuid]);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'gustOfWindMove', {strict: true});
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
                gustOfWind: {
                    templateUuid: template.uuid
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true,
        rules: 'modern',
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'gustOfWind', 
            activityIdentifier: 'gustOfWindMove'
        }], 
        identifier: 'gustOfWind',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['gustOfWindMove'],
            favorite: true
        }
    });
    let featurePush = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'gustOfWindPush', {strict: true});
    if (!featurePush) return;
    let targets = templateUtils.getTokensInTemplate(template);
    await pushHelper(featurePush, targets, template);
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
    if (itemUtils.getConfig(workflow.item, 'pushOnMove')) {
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'gustOfWindPush', {strict: true});
        if (!feature) return;
        let targets = templateUtils.getTokensInTemplate(template);
        await pushHelper(feature, targets, template);
    }
}
async function endTurn({trigger: {entity: template, castData, token}}) {
    let feature = activityUtils.getActivityByIdentifier(fromUuidSync(template.flags.dnd5e.item), 'gustOfWindPush', {strict: true});
    if (!feature) return;
    await pushHelper(feature, [token], template);
}
async function pushHelper(feature, targets, template) {
    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, Array.from(targets));
    if (!featureWorkflow.failedSaves.size) return;
    let gustAngle = template.object.ray.angle;
    let ray = foundry.canvas.geometry.Ray.fromAngle(0, 0, gustAngle, canvas.dimensions.size);
    return Promise.all(featureWorkflow.failedSaves.map(async token => {
        return tokenUtils.moveTokenAlongRay(token, ray, 15);
    }));
}
async function early({dialog}) {
    dialog.configure = false;
}
export let gustOfWind = {
    name: 'Gust of Wind',
    version: '1.2.29',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['gustOfWind']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['gustOfWindMove']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['gustOfWindMove']
            }
        ]
    },
    config: [
        {
            value: 'pushOnMove',
            label: 'CHRISPREMADES.Macros.GustOfWind.PushOnMove',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let gustOfWindGust = {
    name: 'Gust of Wind: Gust',
    version: gustOfWind.version,
    rules: gustOfWind.rules,
    template: [
        {
            pass: 'turnEnd',
            macro: endTurn,
            priority: 50
        }
    ]
};