import {animationUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let templateData = {
        t: 'circle',
        user: game.user,
        distance: workflow.castData.castLevel * 20,
        direction: 0,
        fillColor: game.user.color,
        flags: {
            dnd5e: {
                origin: workflow.item.uuid
            },
            'midi-qol': {
                originUuid: workflow.item.uuid
            },
            'chris-premades': {
                fogCloud: true
            },
            walledtemplates: {
                wallRestriction: 'move',
                wallsBlock: 'recurse'
            }
        },
        angle: 0
    };
    await workflow.actor.sheet.minimize();
    let template = await templateUtils.placeTemplate(templateData);
    await workflow.actor.sheet.maximize();
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    // TODO: Should this be a setting as it was?
    let xray = true;
    if (playAnimation && animationUtils.jb2aCheck() === 'patreon') {
        if (game.modules.get('walledtemplates')?.active) {
            new Sequence()
                .effect()
                .file('jb2a.fog_cloud.1.white')
                .scaleToObject()
                .aboveLighting()
                .opacity(0.5)
                .mask(template)
                .xray(xray)
                .persist(true)
                .attachTo(template)
                .play();
        } else {
            new Sequence()
                .effect()
                .file('jb2a.fog_cloud.1.white')
                .scaleToObject()
                .aboveLighting()
                .opacity(0.5)
                .xray(xray)
                .persist(true)
                .attachTo(template)
                .play();
        }
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 3600 * workflow.item.system.duration.value
        },
        flags: {
            dnd5e: {
                dependents: [template.uuid]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true});
}
// TODO: handle the actual logic of what the fog cloud does