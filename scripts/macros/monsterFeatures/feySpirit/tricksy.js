import {chris} from '../../../helperFunctions.js';
export async function tricksy({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.templateId) return;
    let template = canvas.scene.collections.templates.get(workflow.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'spell.darkness', true);
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