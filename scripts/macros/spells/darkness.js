import {animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let useRealDarkness = itemUtils.getConfig(workflow.item, 'useRealDarkness');
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
                wallsBlack: 'recurse'
            }
        }
    });
    let attachUuids = [template.uuid];
    let darknessSource;
    if (useRealDarkness) {
        [darknessSource] = await genericUtils.createEmbeddedDocuments(workflow.token.parent, 'AmbientLight', [{config: {negative: true, dim: template.distance}, x: template.x, y: template.y}]);
        attachUuids.push(darknessSource.uuid);
        template.addDependent(darknessSource);
    }
    let attachToken = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.macros.darkness.attach');
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
        let currAttached = token.document.flags?.['chris-premades']?.attached?.attachedEntityUuids ?? [];
        await genericUtils.update(token.document, {
            flags: {
                'chris-premades': {
                    attached: {
                        attachedEntityUuids: currAttached.concat(...attachUuids)
                    }
                }
            }
        });
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
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'useRealDarkness',
            label: 'CHRISPREMADES.config.realDarkness',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
};