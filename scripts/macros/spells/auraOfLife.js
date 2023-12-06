import {chris} from '../../helperFunctions.js';
import {effectAuras} from '../../utility/effectAuras.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let flagAuras = {
        'auraOfLife': {
            'name': 'auraOfLife',
            'castLevel': workflow.castData.castLevel,
            'range': 30,
            'disposition': 'ally',
            'effectName': 'Aura of Life',
            'macroName': 'auraOfLife'
        }
    }
    effectAuras.add(flagAuras, workflow.token.document.uuid, true);
}
async function end(token) {
    effectAuras.remove('auraOfLife', token.document.uuid);
}
function effect(effect, updates, options, user) {
    if (!updates.changes || !effect.parent) return;
    if (updates.changes.length === 0) return;
    if (effect.parent.constructor.name != 'Actor5e') return;
    if (!chris.findEffect(effect.parent, 'Aura of Life')) return;
    let changed = false;
    for (let i of updates.changes) {
        if (i.key != 'system.attributes.hp.tempmax') continue;
        let number = Number(i.value);
        if (isNaN(number) || number > 0) continue;
        i.value = 0;
        changed = true;
    }
    if (!changed) return;
    effect.updateSource({'changes': updates.changes});
}
async function aura(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Aura of Life - Aura');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'name': 'Aura of Life',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'necrotic',
                'priority': 20
            }
        ]
    };
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function turns(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let effect = chris.findEffect(targetToken.actor, 'Aura of Life');
    if (!effect) return;
    if (effect.origin != origin.uuid) return;
    if (targetToken.actor.system.attributes.hp.value > 0) return;
    let deadEffect = chris.findEffect(targetToken.actor, 'Dead');
    if (deadEffect) return;
    await origin.displayCard();
    await chris.applyDamage([targetToken], 1, 'healing');
}
export let auraOfLife = {
    'item': item,
    'end': end,
    'aura': aura,
    'effect': effect,
    'turns': turns
}