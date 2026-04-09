import {socket, sockets} from '../../../../../lib/sockets.js';
import {actorUtils, animationUtils, combatUtils, compendiumUtils, constants, crosshairUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function checkBonus(token, checkTurnOn, checkTurnOff) {
    if (!checkTurnOn && !checkTurnOff) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'emboldeningBond');
    if (!effect) return;
    if (!combatUtils.perTurnCheck(effect, 'emboldeningBond')) return;
    let bonusActive = effect.flags['chris-premades']?.emboldeningBond?.inRange;
    if (!checkTurnOff && bonusActive) return;
    if (!checkTurnOn && !bonusActive) return;
    let expansive = effect.flags['chris-premades']?.emboldeningBond?.expansiveBond;
    let distance = expansive ?? 30;
    let nearbyTargets = tokenUtils.findNearby(token, distance, 'ally').filter(i => effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond'));
    let updates = {
        changes: [],
        flags: {
            'chris-premades': {
                emboldeningBond: {
                    inRange: nearbyTargets.length > 0
                }
            }
        }
    };
    if (!nearbyTargets.length) {
        if (bonusActive) await genericUtils.update(effect, updates);
        return;
    }
    if (bonusActive) return;
    updates.changes.push({
        key: 'system.attributes.init.bonus',
        mode: 2,
        value: '1d4',
        priority: 20
    });
    await genericUtils.update(effect, updates);
}
async function turnStart({trigger: {token}}) {
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
        duration: itemUtils.convertDuration(workflow.activity),
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                emboldeningBond: {
                    inRange: true
                }
            }
        },
        changes: [{
            key: 'system.attributes.init.bonus',
            mode: 2,
            value: '1d4',
            priority: 20
        }]
    };
    for (let triggerType of ['midi.actor', 'movement', 'combat', 'save', 'skill', 'check']) {
        effectUtils.addMacro(effectData, triggerType, ['emboldeningBondEmboldened']);
    }
    let expansive = itemUtils.getItemByIdentifier(workflow.actor, 'expansiveBond');
    let protective = itemUtils.getItemByIdentifier(workflow.actor, 'protectiveBond');
    if (expansive) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.expansiveBond', 60);
    if (protective) {
        let promptTargetInstead = itemUtils.getConfig(protective, 'promptTargetInstead');
        genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.protectiveBond', true);
        genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.protectiveBondPromptDamaged', promptTargetInstead);
    }
    if (playAnimation) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.playAnimation', true);
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'emboldeningBond'});
    }
}
async function targetApplyDamaged({trigger: {entity: effect}, workflow, ditem}) {
    if (!ditem.isHit) return;
    if (['healing', 'temphp'].includes(workflow.defaultDamageType)) return;
    if (workflow.item.flags?.['chris-premades']?.protectiveBond) return;
    let bondFlag = effect.flags['chris-premades']?.emboldeningBond;
    if (!bondFlag?.protectiveBond) return;
    let expansive = bondFlag.expansiveBond;
    let promptTarget = bondFlag.protectiveBondPromptDamaged;
    let playAnimation = bondFlag.playAnimation && animationUtils.jb2aCheck();
    let distance = expansive ?? 30;
    let targetToken = workflow.targets.find(i => i.actor === effect.parent);
    if (!targetToken) return;
    let nearbyTargets = tokenUtils.findNearby(targetToken, distance, 'ally').filter(i => effectUtils.getEffectByIdentifier(i.actor, 'emboldeningBond') && !actorUtils.hasUsedReaction(i.actor));
    if (!nearbyTargets.length) return;
    let featureName = genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.Protective');
    if (promptTarget) {
        let content = genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.ProtectiveChooseAlly');
        let selection = await dialogUtils.selectTargetDialog(featureName, content, nearbyTargets);
        if (!selection) return;
        selection = selection[0];
        content = genericUtils.format('CHRISPREMADES.Macros.EmboldeningBond.ProtectivePrompt', {targetName: targetToken.actor.name, featureName});
        let userId = socketUtils.firstOwner(selection.document, true);
        let agree = await dialogUtils.confirm(featureName, content, {userId});
        if (!agree) return;
        await doTeleport(ditem, selection, targetToken, workflow.actor, expansive, playAnimation);
    } else {
        for (let token of nearbyTargets) {
            let owner = socketUtils.firstOwner(token.document);
            if (!owner) continue;
            let content = genericUtils.translate('CHRISPREMADES.Macros.EmboldeningBond.ProtectiveTitle');
            if (owner.isGM) content += ' [' + token.actor.name + ']';
            let selection = await dialogUtils.confirm(featureName, content, {userId: owner.id});
            if (!selection) continue;
            if (await doTeleport(ditem, token, targetToken, workflow.actor, expansive, playAnimation)) break;
        }
    }
}
async function doTeleport(ditem, token, target, attacker, expansive, playAnimation) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Protective Bond: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.EmboldeningBond.ProtectiveDamage'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let activityId = Object.keys(featureData.system.activities)[0];
    if (expansive) {
        featureData.system.activities[activityId].damage.parts = ditem.rawDamageDetail.map(i => ({
            custom: {
                enabled: true,
                formula: Math.floor(i.value / 2).toString()
            },
            types: ['none']
        }));
    } else {
        featureData.system.activities[activityId].damage.parts = ditem.rawDamageDetail.map(i => ({
            custom: {
                enabled: true,
                formula: i.value
            },
            types: [i.type]
        }));
    }
    genericUtils.setProperty(featureData, 'flags.chris-premades.protectiveBond', true);
    await socket.executeAsUser(sockets.teleport.name, socketUtils.firstOwner(token.document, true), [token.document.uuid], token.document.uuid, {
        range: 5,
        centerpoint: target.center, 
        animation: playAnimation ? 'mistyStep' : 'none',
        crosshairsConfig: {
            size: canvas.grid.distance * token.document.width / 2,
            icon: token.document.texture.src,
            resolution: (token.document.width % 2) ? 1 : -1
        }
    });
    await actorUtils.setReactionUsed(token.actor);
    await workflowUtils.syntheticItemDataRoll(featureData, attacker, [token]);
    workflowUtils.negateDamageItemDamage(ditem);
    return true;
}
async function attack({trigger: {entity: effect}, workflow}) {
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
    if (!combatUtils.perTurnCheck(effect, 'emboldeningBond')) return;
    if (!effect.flags['chris-premades'].emboldeningBond.inRange) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttackDetail', {itemName: effect.name, bonusFormula: '1d4', attackTotal: workflow.attackTotal}));
    if (!selection) return;
    await combatUtils.setTurnCheck(effect, 'emboldeningBond');
    await workflowUtils.bonusAttack(workflow, '1d4');
}
async function bonus({trigger: {roll, entity: effect}}) {
    if (!combatUtils.perTurnCheck(effect, 'emboldeningBond')) return;
    if (!effect.flags['chris-premades'].emboldeningBond.inRange) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotalDetail', {itemName: effect.name, bonusFormula: '1d4', rollTotal: roll.total}));
    if (!selection) return;
    await combatUtils.setTurnCheck(effect, 'emboldeningBond');
    return await rollUtils.addToRoll(roll, '1d4');
}
export let emboldeningBond = {
    name: 'Emboldening Bond',
    version: '1.1.0',
    hasAnimation: true,
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
        }
    ]
};
export let emboldeningBondEmboldened = {
    name: 'Emboldening Bond: Emboldened',
    version: emboldeningBond.version,
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            },
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
    save: [
        {
            pass: 'bonus',
            macro: bonus,
            priroity: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: bonus,
            priroity: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: bonus,
            priority: 50
        }
    ]
};