import {chris} from '../../helperFunctions.js';
import {effectAuras} from '../../utility/effectAuras.js';
async function move(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Aura of Purity - Aura');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'label': 'Aura of Purity',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.ci.value',
                'mode': 0,
                'value': 'diseased',
                'priority': 20
            },
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'poison',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.blinded',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.charmed',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.deafened',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.frightened',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.paralyzed',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.poisoned',
                'mode': 5,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.CR.stunned',
                'mode': 5,
                'value': '1',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true
            }
        }
    }
    let effect = chris.findEffect(token.actor, effectData.label);
    if (effect?.origin === effectData.origin) return;
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let flagAuras = {
        'auraOfPurity': {
            'name': 'auraOfPurity',
            'castLevel': workflow.castData.castLevel,
            'range': 30,
            'disposition': 'ally',
            'effectName': 'Aura of Purity',
            'macroName': 'auraOfPurity'
        }
    }
    effectAuras.add(flagAuras, workflow.token.document.uuid, true);
}
async function end(token) {
    effectAuras.remove('auraOfPurity', token.document.uuid);
}
export let auraOfPurity = {
    'move': move,
    'item': item,
    'end': end
}