import {animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let useRealDarkness = itemUtils.getConfig(workflow.item, 'useRealDarkness');
    let darknessAnimation = itemUtils.getConfig(workflow.item, 'darknessAnimation');
    let template = workflow.template;
    let token = workflow.token;
    if (!template || !token) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name,
                    visibility: {
                        obscured: true,
                        magicalDarkness: true
                    }
                }
            },
            walledtemplates: {
                wallRestriction: 'move',
                wallsBlock: 'recurse'
            }
        }
    });
    let attachUuids = [template.uuid];
    let darknessSource;
    if (useRealDarkness) {
        [darknessSource] = await genericUtils.createEmbeddedDocuments(template.parent, 'AmbientLight', [{config: {negative: true, dim: template.distance, animation: {type: darknessAnimation}}, x: template.x, y: template.y}]);
        attachUuids.push(darknessSource.uuid);
        effectUtils.addDependent(template, [darknessSource]);
    }
    let attachToken = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.Darkness.Attach');
    if (attachToken) {
        await genericUtils.update(template, {
            x: token.center.x,
            y: token.center.y
        });
        if (darknessSource) {
            await genericUtils.update(darknessSource, {
                x: token.center.x,
                y: token.center.y
            });
        }
        await tokenUtils.attachToToken(token, attachUuids);
    }
    let xray = true;
    if (playAnimation && animationUtils.jb2aCheck()) {
        if (game.modules.get('walledtemplates')?.active) {
            new Sequence()
                .effect()
                .file('jb2a.darkness.black')
                .scaleToObject()
                .aboveLighting()
                .opacity(0.5)
                .xray(xray)
                .mask(template)
                .persist(true)
                .attachTo(template)
                .play();
        } else {
            new Sequence()
                .effect()
                .file('jb2a.darkness.black')
                .scaleToObject()
                .aboveLighting()
                .opacity(0.5)
                .xray(xray)
                .persist(true)
                .attachTo(template)
                .play();
        }
    }
}
export let darkness = {
    name: 'Darkness',
    version: '1.1.0',
    hasAnimation: true,
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