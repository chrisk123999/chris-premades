import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
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
    let distance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
    let nearbyTargets = chris.findNearby(token, distance, 'all', true).concat(token).filter(t => t.actor.effects.find(e => e.origin === origin.uuid && e.label === 'Emboldening Bond'));
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
    async function effectMacro2() {
        await chrisPremades.macros.emboldeningBond.removeBonus(token);
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
                },
                'onDelete': {
                    'script': chris.functionToString(effectMacro2)
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
    if (workflow.actor.flags['chris-premades']?.feature?.emboldeningBond?.protectiveBond) {
        setProperty(effectData3, 'flags.chris-premades.feature.emboldeningBond.protectiveBond', true);
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
async function damage(targetToken, {workflow, ditem}) {
    if (!workflow) return;
    if (workflow.defaultDamageType === 'healing' || workflow.defaultDamageType === 'temphp') return;
    if (workflow.item?.flags?.['chris-premades']?.feature?.protectiveBond) return;
    let effect = chris.findEffect(targetToken.actor, 'Emboldening Bond');
    if (!effect) return;
    if (!effect.flags['chris-premades']?.feature?.emboldeningBond?.protectiveBond) return;
    if (chris.findEffect(targetToken.actor, 'Reaction')) return;
    let distance = effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond ?? 30;
    let nearbyTargets = chris.findNearby(targetToken, distance, 'all', true).filter(t => t.actor.effects.find(e => e.origin === effect.origin && e.label === 'Emboldening Bond') && !chris.findEffect(t.actor, 'Reaction'));
    if (nearbyTargets.length === 0) return;
    let queueSetup = await queue.setup(workflow.uuid, 'protectiveBond', 400);
    if (!queueSetup) return;
    for (let token of nearbyTargets) {
        let owner = chris.firstOwner(token.document);
        if (!owner) continue;
        let title = 'Protective Bond: Protect Target?';
        if (owner.isGM) title = '[' + token.actor.name + '] ' + title;
        let selection = await chris.remoteDialog(title, [['Yes', true], ['No', false]], chris.firstOwner(token.document).id);
        if (!selection) continue;
        let featureDamage = 0;
        let damages = {};
        for (let term of workflow.damageRoll.terms) {
            if (isNaN(term.total)) continue;
            let flavor = term.flavor.toLowerCase();
            if (!damages[flavor]) damages[flavor] = 0;
            damages[flavor] += term.total;
        }
        let forceDR = !!effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond;
        for (let [key, value] of Object.entries(damages)) {
            if (chris.checkTrait(token.actor, 'di', key)) continue;
            let dr = chris.checkTrait(token.actor, 'dr', key);
            if (forceDR) dr = true;
            let dv = chris.checkTrait(token.actor, 'dv', key);
            if (dr && !dv) featureDamage += Math.floor(value / 2);
            if (!dr && dv) featureDamage += value * 2;
            if (!dr && !dv) featureDamage += value;
        }
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Protective Bond - Damage', false);
        if (!featureData) {
            queue.remove(workflow.uuid);
            return;
        }
        delete featureData._id;
        if (effect.flags['chris-premades']?.feature?.emboldeningBond?.expansiveBond) setProperty(featureData, 'flags.autoanimations.data.options.range', 60);
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Protective Bond - Damage');
        featureData.system.damage.parts = [
            [
                featureDamage,
                'none'
            ]
        ];
        setProperty(featureData, 'flags.chris-premades.feature.protectiveBond', true);
        async function effectMacro() {
            await chrisPremades.macros.emboldeningBond.teleport(token);
        }
        let effectData = {
            'label': featureData.name,
            'icon': featureData.img,
            'duration': {
                'seconds': 1
            },
            'origin': workflow.item.uuid,
            'flags': {
                'effectmacro': {
                    'onCreate': {
                        'script': chris.functionToString(effectMacro)
                    }
                }
            }
        };
        let updates = {
            'embedded': {
                'Item': {
                    [featureData.name]: featureData
                },
                'ActiveEffect': {
                    [effectData.label]: effectData
                }
            }
        };
        let options = {
            'permanent': false,
            'name': featureData.name,
            'description': featureData.name
        };
        await warpgate.mutate(token.document, updates, {}, options);
        ditem.appliedDamage = 0;
        ditem.hpDamage = 0;
        ditem.newHP = ditem.oldHP;
        ditem.newTempHP = ditem.oldTempHP;
        ditem.newVitality = ditem.oldVitality;
        ditem.tempDamage = 0;
        ditem.totalDamage = 0;
        break;
    }
    queue.remove(workflow.uuid);
}
async function teleport(token) {
    let feature = token.actor.items.find(i => i.flags['chris-premades']?.feature?.protectiveBond);
    if (feature) await feature.use();
    await warpgate.revert(token.document, 'Protective Bond - Damage');
}
async function removeBonus(token) {
    let effect = chris.findEffect(token.actor, 'Emboldening Bond Bonus');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let emboldeningBond = {
    'turn': turn,
    'move': move,
    'item': item,
    'remove': remove,
    'damage': damage,
    'teleport': teleport,
    'removeBonus': removeBonus
}