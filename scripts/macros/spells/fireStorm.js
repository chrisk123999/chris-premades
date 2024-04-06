import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function fireStorm({speaker, actor, token, character, item, args, scope, workflow}) {
    let playAnimation = chris.getConfiguration(workflow.item, 'animation') ?? true;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fireStorm', 50);
    if (!queueSetup) return;
    let templateData = {
        't': 'rect',
        'user': game.user,
        'distance': 14.14,
        'direction': 45,
        'x': 3080,
        'y': 1680,
        'fillColor': game.user.color,
        'flags': {
            'dnd5e': {
                'origin': workflow.item.uuid
            },
            'walledtemplates': {
                'hideBorder': "alwaysShow"
            }
        },
        'width': 10,
        'angle': 0
    };
    let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {'parent': canvas.scene});
    let templates = [];
    await workflow.actor.sheet.minimize();
    ui.notifications.info('Place up to 10 templates. Right click to finish.');
    for (let i = 0; i < 10; i++) {
        let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
        try{
            let [finalTemplate] = await template.drawPreview();
            templates.push(finalTemplate);
        } catch {/* empty */}
        if (templates.length != i + 1) break;
    }
    await workflow.actor.sheet.maximize();
    if (!templates.length) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targets = new Set();
    for (let i of templates) {
        let position = i.object.ray.project(0.5);
        if (playAnimation) {
            new Sequence()
                .effect()
                .file('jb2a.explosion.01.orange')
                .atLocation(position)
                .scale(2)
                .play();
        }
        let tokens = chris.templateTokens(i);
        if (!tokens.length) continue;
        for (let j of tokens) targets.add(j);
    }
    chris.updateTargets(Array.from(targets));
    async function effectMacro() {
        let templates = effect.flags['chris-premades']?.spell?.fireStorm?.templates;
        if (!templates) return;
        for (let i of templates) {
            let template = await fromUuid(i);
            if (!template) continue;
            await template.delete();
        }
    }
    let effectData = {
        'name': workflow.item.name + ' Templates',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1,
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'fireStorm': {
                        'templates': templates.map(i => i.uuid)
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
    queue.remove(workflow.item.uuid);
}
