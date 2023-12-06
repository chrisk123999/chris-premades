import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function borrowedKnowledge({speaker, actor, token, character, item, args, scope, workflow}) {
    function dialogRender(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '50px';
            t.style.textAlign = 'center';
            t.style.paddingRight = '5px';
        }
    }
    let selection = await warpgate.menu({
    'inputs': [
        {
            'label': 'Skill:',
            'type': 'select',
            'options': Object.entries(CONFIG.DND5E.skills).filter(([key, value]) => workflow.actor.system.skills[key].value < 1).map(([i, j]) => ({'value': i, 'html': j.label}))
        },
    ],
    'buttons': constants.okCancel
    }, {
        'title': workflow.item.name,
        'render': dialogRender
    });
    if (!selection.buttons) return;
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 3600
        },
        'changes': [
            {
                'key': 'system.skills.' + selection.inputs[0] +'.value',
                'mode': 4,
                'value': 1,
                'priority': 20
            }
        ]
    };
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(workflow.actor, effectData);
}