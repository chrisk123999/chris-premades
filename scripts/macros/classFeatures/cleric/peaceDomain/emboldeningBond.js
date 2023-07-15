import {chris} from '../../../../helperFunctions.js';
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
    let effect2 = chris.findEffect(token.actor, 'Emboldening Bond Bonus');
    if (effect2) return;
    let maxDistance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
    let nearbyTargets = await chris.findNearby(token, maxDistance, 'all', true).concat(token).filter(t => t.actor.effects.find(e => e.origin === origin.uuid && e.label === 'Emboldening Bond'));
    if (nearbyTargets.length < 2) return;
    let effectData2 = duplicate(effectData);
    setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.sourceTokenUuid', token.document.uuid);
    setProperty(effectData2, 'origin', origin.uuid);
    setProperty(effectData2, 'icon', origin.img);
    setProperty(effectData2, 'duration.seconds', effect.duration.seconds);
    if (token.actor.flags['chris-premades']?.feature?.expansiveBond) setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
    await chris.createEffect(token.actor, effectData2);
}
async function checkBonus(effect) {
    if (!effect.origin) return;
    let tokens = canvas.scene.tokens.filter(t => t.actor.effects.find(e => e.label == 'Emboldening Bond' && e.origin === effect.origin));
    for (let token of tokens) {
        let effect3 = chris.findEffect(token.actor, 'Emboldening Bond');
        let distance = effect3.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
        let nearbyTargets = chris.findNearby(token.object, distance, 'all', true).concat(token.object).filter(t => t.actor.effects.find(e => e.label === 'Emboldening Bond'));
        let effect2 = chris.findEffect(token.actor, 'Emboldening Bond Bonus');
        if (nearbyTargets.length < 2) {
            if (effect2) {
                await chris.updateEffect(effect2, {'disabled': true});
                await chris.removeEffect(effect2);
            }
        } else {
            if (effect2) continue;
            if (chris.inCombat()) {
                let currentTurn = game.combat.round + '-' + game.combat.turn;
                let previousTurn = effect3.flags['chris-premades']?.feature?.emboldeningBond.turn;
                if (currentTurn === previousTurn) continue;
            }
            let effectData2 = duplicate(effectData);
            setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.sourceTokenUuid', effect3.flags['chris-premades']?.feature?.emboldeningBond?.sourceTokenUuid);
            setProperty(effectData2, 'origin', effect3.origin);
            setProperty(effectData2, 'icon', effect3.icon);
            setProperty(effectData2, 'duration.seconds', effect3.duration.seconds);
            if (effect3.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond) setProperty(effectData2, 'flags.chris-premades.feature.emboldeningBond.expansiveBond', 60);
            await chris.createEffect(token.actor, effectData2);
        }
    }
}
async function move(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    let effect = chris.findEffect(token.actor, 'Emboldening Bond');
    if (!effect) return;
    checkBonus(effect);
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
        await chris.createEffect(token.actor, effectData3);
        await chris.createEffect(token.actor, effectData2);
    }
}
async function remove(token) {
    let effect = chris.findEffect(token.actor, 'Emboldening Bond');
    if (!effect) return;
    await effect.setFlag('chris-premades', 'feature.emboldeningBond.turn', game.combat.round + '-' + game.combat.turn);
}
export let emboldeningBond = {
    'turn': turn,
    'move': move,
    'item': item,
    'remove': remove
}