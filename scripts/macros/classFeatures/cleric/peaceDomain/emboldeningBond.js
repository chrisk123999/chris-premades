import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function effectMacro() {
    await chrisPremades.macros.emboldeningBond.remove(token);
}
let effectData = {
    'label': 'Emboldening Bond Bonus',
    'changes': [
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.count',
            'mode': 0,
            'value': '1',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.label',
            'mode': 0,
            'value': 'Emboldening Bond',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.save.all',
            'mode': 0,
            'value': '+ 1d4',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.attack.all',
            'mode': 0,
            'value': '+ 1d4',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.check.all',
            'mode': 0,
            'value': '+ 1d4',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.optional.emboldeningBond.skill.all',
            'mode': 0,
            'value': '+ 1d4',
            'priority': 20
        }
    ],
    'flags': {
        'effectmacro': {
            'onDelete': {
                'script': chris.functionToString(effectMacro)
            }
        }
    }
};
async function turn(token, origin, effect) {
    let queueSetup = await queue.setup('emboldeningBond', effect.uuid, 50);
    if (!queueSetup) return;
    let effect2 = chris.findEffect(token.actor, 'Emboldening Bond Bonus');
    if (effect2) {
        queue.remove('emboldeningBond');
        return;
    }
    let maxDistance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
    let nearbyTargets = await chris.findNearby(token, maxDistance, 'all', true).concat(token).filter(i => i.actor.effects.find(j => j.origin === origin.uuid && j.label === 'Emboldening Bond'));
    if (nearbyTargets.length < 2) {
        queue.remove('emboldeningBond');
        return;
    }
    let effectData2 = duplicate(effectData);
    setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.sourceTokenUuid', token.document.uuid);
    setProperty(effectData2, 'origin', origin.uuid);
    setProperty(effectData2, 'icon', origin.img);
    setProperty(effectData2, 'duration.seconds', effect.duration.seconds);
    if (token.actor.flags['chris-premades']?.feature?.expansiveBond) setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
    await chris.createEffect(token.actor, effectData2);
    queue.remove('emboldeningBond');
}
async function checkBonus(token) {
    let effects = token.actor.effects.filter(i => i.label === 'Emboldening Bond');
    if (effects.length === 0) return;
    let effect2 = chris.findEffect(token.actor, 'Emboldening Bond Bonus');
    let targetMap = {};
    if (effect2) {
        for (let effect of effects) {
            let maxDistance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
            let origin;
            if (effect.origin) origin = await fromUuid(effect.origin);
            if (!origin) continue;
            let nearbyTargets = targetMap[effect.uuid];
            if (!nearbyTargets) {
                targetMap[effect.uuid] = await chris.findNearby(token.object, maxDistance, 'all', true).concat(token.object).filter(i => i.actor.effects.find(j => j.origin === origin.uuid && j.label === 'Emboldening Bond'));
                nearbyTargets = targetMap[effect.uuid];
            }
            if (nearbyTargets.length < 2) continue;
            return;
        }
        await chris.updateEffect(effect2, {'disabled': true});
        await chris.removeEffect(effect2);
    }
    for (let effect of effects) {
        if (chris.inCombat()) {
            let currentTurn = game.combat.round + '-' + game.combat.turn;
            let previousTurn = effect.flags['chris-premades']?.feature?.emboldeningBond.turn;
            if (currentTurn === previousTurn) return;
        }
        let maxDistance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
        let origin;
        if (effect.origin) origin = await fromUuid(effect.origin);
        if (!origin) continue;
        let nearbyTargets = targetMap[effect.uuid];
        if (!nearbyTargets) {
            targetMap[effect.uuid] = await chris.findNearby(token.object, maxDistance, 'all', true).concat(token.object).filter(i => i.actor.effects.find(j => j.origin === origin.uuid && j.label === 'Emboldening Bond'));
            nearbyTargets = targetMap[effect.uuid];
        }
        if (nearbyTargets.length < 2) continue;
        let effectData2 = duplicate(effectData);
        setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.sourceTokenUuid', token.uuid);
        setProperty(effectData2, 'origin', origin.uuid);
        setProperty(effectData2, 'icon', origin.img);
        setProperty(effectData2, 'duration.seconds', effect.duration.seconds);
        if (effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond) setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
        await chris.createEffect(token.actor, effectData2);
        return;
    }
}
async function move(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    checkBonus(token);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let effectData2 = duplicate(effectData);
    setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.sourceTokenUuid', token.document.uuid);
    setProperty(effectData2, 'origin', workflow.item.uuid);
    setProperty(effectData2, 'icon', workflow.item.img);
    setProperty(effectData2, 'duration.seconds', 600)
    async function effectMacro() {
        await chrisPremades.macros.emboldeningBond.turn(token, origin, effect);
    }
    let effectData3 = {
        'label': 'Emboldening Bond',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 600,
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onEachTurn': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'feature': {
                    'emboldeningBond': {
                        'sourceTokenUuid': workflow.token.document.uuid
                    }
                }
            }
        }
    };
    if (workflow.actor.flags['chris-premades']?.feature?.expansiveBond) {
        setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
        setProperty(effectData3, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
    }
    for (let token of Array.from(workflow.targets)) {
        if (chris.inCombat()) {
            let effect = chris.findEffect(token.actor, 'Emboldening Bond');
            if (effect) {
                let previousTurn = effect.flags['chris-premades']?.feature?.emboldeningBond.turn;
                if (previousTurn) setProperty(effectData3, 'flags.chris-premades.feature.emboldeningBond.turn', previousTurn);
            }
        }
        await chris.createEffect(token.actor, effectData3);
        if (chris.findEffect(token.actor, 'Emboldening Bond Bonus')) continue;
        await chris.createEffect(token.actor, effectData2);
    }
}
async function remove(token) {
    if (!chris.inCombat()) return;
    let effects = token.actor.effects.filter(i => i.label === 'Emboldening Bond');
    if (effects.length === 0) return;
    for (let effect of effects) {
        await effect.setFlag('chris-premades', 'feature.emboldeningBond.turn', game.combat.round + '-' + game.combat.turn);
    }
}
export let emboldeningBond = {
    'turn': turn,
    'move': move,
    'item': item,
    'remove': remove
}