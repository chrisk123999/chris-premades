import {chris} from '../../helperFunctions.js';
import {effectAura} from '../../movement.js';
async function item({speaker, actor, token, character, item, args}) {
    let castLevel = this.castData.castLevel;
    let spellDC = chris.getSpellDC(this.item);
    let sourceTokenID = this.token.id;
    let range = 30;
    let targetDisposition = 'ally';
    let effectData = {
        'label': 'Aura of Purity',
        'icon': this.item.img,
        'origin': this.item.uuid,
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
        ]
    }
    let effect = chris.findEffect(this.actor, 'Aura of Purity - Aura');
    if (!effect) return;
    await effectAura.add('auraOfPurity', castLevel, spellDC, sourceTokenID, range, targetDisposition, effectData, effect.uuid)
    await effectAura.refresh(null);
}
async function moved(token, castLevel, spellDC, effectData, tokenID) {
    let effect = chris.findEffect(token.actor, effectData.label);
    if (effect?.origin === effectData.origin) return;
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function effectEnd(token, effect) {
    await effectAura.refresh(effect.uuid);
    await effectAura.remove('auraOfPurity', token.id);
}
export let auraOfPurity = {
    'item': item,
    'moved': moved,
    'end': effectEnd
}