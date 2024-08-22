import {animationUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../../utils.js';

async function early({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let useRealDarkness = itemUtils.getConfig(workflow.item, 'useRealDarkness');
    let darknessAnimation = itemUtils.getConfig(workflow.item, 'darknessAnimation');
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
                template: {
                    name: workflow.item.name,
                    visibility: {
                        obscured: true
                    }
                }
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
    let xray = true;
    if (playAnimation && animationUtils.jb2aCheck()) {
        if (game.modules.get('walledtemplates')?.active) {
            new Sequence()
                .effect()
                .file('jb2a.fog_cloud.01.white')
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
                .file('jb2a.fog_cloud.01.white')
                .scaleToObject()
                .aboveLighting()
                .opacity(0.5)
                .xray(xray)
                .persist(true)
                .attachTo(template)
                .play();
        }
    }
    if (useRealDarkness) {
        let [darknessSource] = await genericUtils.createEmbeddedDocuments(template.parent, 'AmbientLight', [{config: {negative: true, dim: template.distance, animation: {type: darknessAnimation}}, x: template.x, y: template.y}]);
        effectUtils.addDependent(template, [darknessSource]);
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
                dependents: [{uuid: template.uuid}]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true});
}
export let fogCloud = {
    name: 'Fog Cloud',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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
            value: 'useRealDarkness',
            label: 'CHRISPREMADES.Config.RealDarkness',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'darknessAnimation',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            type: 'select',
            default: null,
            options: [
                {
                    label: 'DND5E.None',
                    value: null
                },
                ...Object.entries(CONFIG.Canvas.darknessAnimations).flatMap(i => ({label: i[1].label, value: i[0]}))
            ],
            category: 'mechanics'
        }
    ]
};