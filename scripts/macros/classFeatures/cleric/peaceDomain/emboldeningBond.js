import {combatUtils, effectUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

function getBonusEffectData() {
    let bonusEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.Bonus'),
        changes: [
            {
                key: 'flags.midi-qol.optional.emboldeningBond.count',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.label',
                mode: 0,
                value: genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.Bonus'),
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.save.all',
                mode: 0,
                value: '1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.attack.all',
                mode: 0,
                value: '1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.check.all',
                mode: 0,
                value: '1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.skill.all',
                mode: 0,
                value: '1d4',
                priority: 20
            },
            {
                key: 'system.attributes.init.bonus',
                mode: 2,
                value: '1d4',
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.emboldeningBond.macroToCall',
                mode: 0,
                value: 'function.chrisPremades.macros.emboldeningBond.utilFunctions.setUsedFlag',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    return bonusEffectData;
}
async function checkBonus(token, checkTurnOn, checkTurnOff) {
    if (!checkTurnOn && !checkTurnOff) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'emboldeningBond');
    if (!effect) return;
    if (combatUtils.inCombat() && effect.flags['chris-premades']?.emboldeningBond?.used) return;
    let bonusEffect = effectUtils.getEffectByIdentifier(token.actor, 'emboldeningBondBonus');
    if (!checkTurnOff && bonusEffect) return;
    if (!checkTurnOn && !bonusEffect) return;
    let expansive = effect.flags['chris-premades']?.emboldeningBond?.expansiveBond;
    let distance = expansive ?? 30;
    let nearbyTargets = tokenUtils.findNearby(token, distance, 'all').filter(i => effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond'));
    if (!nearbyTargets.length) {
        if (bonusEffect) genericUtils.remove(bonusEffect);
        return;
    }
    if (bonusEffect) return;
    let effectData = getBonusEffectData();
    effectData.origin = effect.origin;
    effectData.img = effect.img;
    effectData.duration = {
        seconds: effect.duration.seconds
    };
    await effectUtils.createEffect(token.actor, effectData, {parentEntity: effect, identifier: 'emboldeningBondBonus'});
    return;
}
async function turnStart({trigger: {entity: effect, token}}) {
    await genericUtils.setFlag(effect, 'chris-premades', 'emboldeningBond.used', false);
    await checkBonus(token, true, false);
}
async function moved({trigger: {token}}) {
    await checkBonus(token, true, true);
    let sceneTokens = token.scene.tokens.map.filter(i => i !== token.document && effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond'));
    await Promise.all(sceneTokens.map(async i => await checkBonus(i, true, true)));
}
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        origin: workflow.item.uuid
    };
    effectUtils.addMacro(effectData, 'movement', ['emboldeningBondEmboldened']);
    effectUtils.addMacro(effectData, 'combat', ['emboldeningBondEmboldened']);
    let effectData2 = getBonusEffectData();
    effectData2.origin = effectData.origin;
    effectData2.img = effectData.img;
    effectData2.duration = effectData.duration;
    let expansive = itemUtils.getItemByIdentifier(workflow.actor, 'expansiveBond');
    let protective = itemUtils.getItemByIdentifier(workflow.actor, 'protectiveBond');
    if (expansive) genericUtils.setProperty(effectData, 'chris-premades.emboldeningBond.expansiveBond', 60);
    if (protective) genericUtils.setProperty(effectData, 'chris-premades.emboldeningBond.protectiveBond', true);
    for (let target of workflow.targets) {
        await effectUtils.createEffects(target.actor, [effectData, effectData2], [{identifier: 'emboldeningBond'}, {identifier: 'emboldeningBondBonus'}]);
    }
}
// TODO: Protective bond part of this

async function setUsedFlag({actor}) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'emboldeningBond');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'emboldeningBond.used', true);
}
export let emboldeningBond = {
    name: 'Emboldening Bond',
    version: '0.12.37',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    utilFunctions: {
        setUsedFlag
    }
};
export let emboldeningBondEmboldened = {
    name: 'Emboldening Bond: Emboldened',
    version: emboldeningBond.version,
    movement: [
        {
            pass: 'moved',
            macro: moved,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
};