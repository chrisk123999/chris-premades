import {chris} from '../../../helperFunctions.js';
export async function tricksy({speaker, actor, token, character, item, args}) {
    if (!this.templateId) return;
    let template = canvas.scene.collections.templates.get(this.templateId);
    if (!template) return;
    await template.setFlag('chris-premades', 'spell.darkness', true);
    let effect = chris.findEffect(this.actor, this.item.name + ' Template');
    if (!effect) return;
    if (!chris.inCombat()) return;
    await effect.update({
        'label': effect.label + ' (' + game.combat.round + '-' + game.combat.turn + ')',
        'origin': this.actor.uuid,
        'flags': {
            'dae': {
                'specialDuration': [
                    'turnEndSource'
                ]
            }
        }
    });
}