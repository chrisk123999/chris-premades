import {Teleport} from '../../../../../lib/teleport.js';
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
    if (!nearbyTargets.length) {
        if (bonusActive) await genericUtils.setFlag(effect, 'chris-premades', 'emboldeningBond.inRange', false);
        return;
    }
    if (bonusActive) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'emboldeningBond.inRange', true);
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
        }
    };
    for (let triggerType of ['midi.actor', 'movement', 'combat', 'save', 'skill', 'check']) {
        effectUtils.addMacro(effectData, triggerType, ['emboldeningBondEmboldened']);
    }
    let expansive = itemUtils.getItemByIdentifier(workflow.actor, 'expansiveBond');
    let protective = itemUtils.getItemByIdentifier(workflow.actor, 'protectiveBond');
    if (expansive) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.expansiveBond', 60);
    if (protective) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.protectiveBond', true);
    if (playAnimation) genericUtils.setProperty(effectData, 'flags.chris-premades.emboldeningBond.playAnimation', true);
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'emboldeningBond'});
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
        let position = await crosshairUtils.aimCrosshair({
            token, 
            maxRange: genericUtils.convertDistance(5), 
            centerpoint: targetToken.center, 
            drawBoundries: true, 
            trackDistance: true, 
            fudgeDistance: targetToken.document.width * canvas.dimensions.distance / 2,
            crosshairsConfig: {
                size: canvas.grid.distance * token.document.width / 2,
                icon: token.document.texture.src,
                resolution: (token.document.width % 2) ? 1 : -1
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
// TODO: Handle bonus to initiative? Could be as simple as being automatic, since /turn means there's no downside to using it pre-combat
// But can't just have it always be on the effect, since it's conditional on being in range
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
        },
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