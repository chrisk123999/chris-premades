import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
async function portalCracker({speaker, actor, token, character, item, args, scope, workflow}) {
    let roll = await workflow.actor.rollSkill('arc');
    if (roll.total >= 20) return;
    if (!workflow.token) return;
    let damageRoll = await new Roll('3d8[' + translate.damageType('psychic') + ']').roll({'async': true});
    await chris.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', [workflow.token], workflow.item.name, workflow.itemCardId);
}
async function planarAdaptation({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Planar Wanderer: Planar Adaptation');
    if (!effect) return;
    let selection = await chris.dialog(workflow.item.name, [['Acid', 'acid'], ['Cold', 'cold'], ['Fire', 'fire']], 'What resistance?');
    if (!selection) return;
    let updates = {
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': selection,
                'priority': 20
            }
        ]
    }
    await chris.updateEffect(effect, updates);
}
export let planarWanderer = {
    'portalCracker': portalCracker,
    'planarAdaptation': planarAdaptation
}