import {Teleport} from '../../../../lib/teleport.js';
import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

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
    let nearbyTargets = tokenUtils.findNearby(token, distance, 'ally').filter(i => effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond'));
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
    let sceneTokens = token.scene.tokens.filter(i => i !== token.document && effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond'));
    await Promise.all(sceneTokens.map(async i => await checkBonus(i, true, true)));
}
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
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
    if (expansive) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.expansiveBond', 60);
    if (protective) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.protectiveBond', true);
    if (protective) effectUtils.addMacro(effectData, 'midi.actor', ['emboldeningBondEmboldened']);
    if (playAnimation) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.playAnimation', true);
    for (let target of workflow.targets) {
        let effect = await effectUtils.createEffect(target.actor, effectData, {identifier: 'emboldeningBond'});
        await effectUtils.createEffect(target.actor, effectData2, {identifier: 'emboldeningBondBonus', parentEntity: effect});
    }
}
async function targetApplyDamaged({trigger: {entity: effect}, workflow, ditem}) {
    if (['healing', 'temphp'].includes(workflow.defaultDamageType)) return;
    if (workflow.item.flags?.['chris-premades']?.protectiveBond) return;
    if (!effect.flags['chris-premades']?.emboldeningBond?.protectiveBond) return;
    let expansive = effect.flags['chris-premades']?.emboldeningBond?.expansiveBond;
    let playAnimation = effect.flags['chris-premades']?.emboldeningBond?.playAnimation && animationUtils.jb2aCheck();
    let distance = expansive ?? 30;
    let targetToken = workflow.targets.find(i => i.actor === effect.parent);
    if (!targetToken) return;
    let nearbyTargets = tokenUtils.findNearby(targetToken, distance, 'ally').filter(i => effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond') && !actorUtils.hasUsedReaction(i.actor));
    if (!nearbyTargets.length) return;
    for (let token of nearbyTargets) {
        let owner = socketUtils.firstOwner(token.document);
        if (!owner) continue;
        let content = genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.ProtectiveTitle');
        if (owner.isGM) content += ' [' + token.actor.name + ']';
        let selection = await dialogUtils.confirm('CHRISPREMADES.Macros.EmboldeningBond.Protective', content, {userId: owner.id});
        if (!selection) continue;
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Protective Bond: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.EmboldeningBond.ProtectiveDamage'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        if (expansive) {
            featureData.system.damage.parts = ditem.rawDamageDetail.map(i => [Math.floor(i.value / 2), 'none']);
        } else {
            featureData.system.damage.parts = ditem.rawDamageDetail.map(i => [i.value + '[' + i.type + ']', i.type]);
        }
        genericUtils.setProperty(featureData, 'flags.chris-premades.protectiveBond', true);
        let position = await crosshairUtils.aimCrosshair({
            token, 
            maxRange: 5, 
            centerpoint: targetToken.center, 
            drawBoundries: true, 
            trackDistance: true, 
            fudgeDistance: targetToken.document.width * canvas.dimensions.distance / 2,
            crosshairsConfig: {
                size: canvas.grid.distance * token.document.width / 2,
                icon: token.document.texture.src,
                resolution: token.document.width % 2 === 0 ? -1 : 1
            }
        });
        if (position.cancelled) continue;
        let teleport = new Teleport([token], token, {animation: playAnimation ? 'mistyStep' : 'none'});
        teleport.template = position;
        await teleport._move();
        await actorUtils.setReactionUsed(token.actor);
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [token]);
        workflowUtils.negateDamageItemDamage(ditem);
        break;
    }
}
async function setUsedFlag({actor}) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'emboldeningBond');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'emboldeningBond.used', true);
}
export let emboldeningBond = {
    name: 'Emboldening Bond',
    version: '0.12.40',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
    ],
    utilFunctions: {
        setUsedFlag
    }
};
export let emboldeningBondEmboldened = {
    name: 'Emboldening Bond: Emboldened',
    version: emboldeningBond.version,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: targetApplyDamaged,
                priority: 50
            }
        ]
    },
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