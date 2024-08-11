import {animationUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../../utils.js';

async function early({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let templateData = {
        t: 'rect',
        user: game.user,
        distance: 14.14,
        direction: 45,
        x: 3080,
        y: 1680,
        fillColor: game.user.color,
        flags: {
            dnd5e: {
                origin: workflow.item.uuid
            },
            walledtemplates: {
                hideBorder: 'alwaysShow'
            }
        },
        width: 10,
        angle: 0
    };
    let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {parent: canvas.scene});
    let templates = [];
    await workflow.actor.sheet.minimize();
    ui.notifications.info(genericUtils.translate('CHRISPREMADES.Macros.FireStorm.Place'));
    for (let i = 0; i < 10; i++) {
        let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
        try {
            let [finalTemplate] = await template.drawPreview();
            templates.push(finalTemplate);
        } catch {/* empty */}
        if (templates.length != i + 1) break;
    }
    await workflow.actor.sheet.maximize();
    if (!templates.length) return;
    let targets = new Set();
    for (let i of templates) {
        let position = i.object.ray.project(0.5);
        if (playAnimation && animationUtils.jb2aCheck()) {
            new Sequence()
                .effect()
                .file('jb2a.explosion.01.orange')
                .atLocation(position)
                .scale(2)
                .play();
        }
        let tokens = templateUtils.getTokensInTemplate(i);
        if (!tokens.size) continue;
        for (let j of tokens) targets.add(j);
    }
    genericUtils.updateTargets(targets);
    let effectData = {
        name: workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Macros.FireStorm.Templates'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        flags: {
            dnd5e: {
                dependents: templates.map(i => {return {uuid: i.uuid};})
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let fireStorm = {
    name: 'Fire Storm',
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
        }
    ]
};