import {chris} from '../../../helperFunctions.js';
export async function tricksy({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.templateId) return;
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.update({
        'flags': {
            'chris-premades': {
                'spell': {
                    'darkness': true
                }
            },
            'limits': {
                'sight': {
                    'basicSight': {
                        'enabled': true,
                        'range': 0
                    },
                    'ghostlyGaze': {
                        'enabled': true,
                        'range': 0
                    },
                    'lightPerception': {
                        'enabled': true,
                        'range': 0
                    }
                },
                'light': {
                    'enabled': true,
                    'range': 0
                }
            },
            'walledtemplates': {
                'wallRestriction': 'move',
                'wallsBlock': 'recurse'
            }
        }
    });

    let xray = game.settings.get('chris-premades', 'Show Limits Animations');
    new Sequence().effect().file('jb2a.darkness.black').scaleToObject(1.25).aboveLighting().opacity(0.5).xray(xray).persist(true).attachTo(template).play();
    let effect = chris.findEffect(workflow.actor, workflow.item.name + ' Template');
    if (!effect) return;
    if (!chris.inCombat()) return;
    await effect.update({
        'label': effect.label + ' (' + game.combat.round + '-' + game.combat.turn + ')',
        'origin': workflow.actor.uuid,
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnEndSource'
                ]
            }
        }
    });
}