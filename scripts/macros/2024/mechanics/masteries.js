import {custom} from '../../../events/custom.js';
import {combatUtils} from '../../../lib/utilities/combatUtils.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
function perTurnCheck(actor, mastery) {
    if (!combatUtils.inCombat()) return true;
    let previousTurn = actor.flags['chris-premades']?.mastery?.[mastery]?.turn;
    return previousTurn !== combatUtils.currentTurn();
}
async function setTurnCheck(actor, mastery) {
    if (!combatUtils.inCombat()) return;
    let turn = game.combat.round + '-' + game.combat.turn;
    await genericUtils.setFlag(actor, 'chris-premades', 'mastery.' + mastery + '.turn', turn);
}
async function cleave({workflow}) {
    if (!perTurnCheck(workflow.actor, 'cleave')) return;
    if (!workflow.hitTargets.size) return;
    if (workflow.item.flags['chris-premades']?.cleaveMastery) return;
    let target = workflow.hitTargets.first();
    let targetNearbyAllies = tokenUtils.findNearby(target, 5, 'ally');
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => i != target && targetNearbyAllies.includes(i));
    if (!nearbyTargets.length) return;
    let selection = await dialogUtils.selectTargetDialog('CHRISPREMADES.Mastery.Cleave.Name', 'CHRISPREMADES.Cleave.Use', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    if (!selection?.length) return;
    await setTurnCheck(workflow.actor, 'cleave');
    selection = selection[0];
    let mod = workflow.actor.system.abilities[workflow.activity.ability].mod;
    if (mod > 0) {
        let itemData = workflow.item.toObject();
        delete itemData._id;
        itemData.system.activities[workflow.activity.id].damage.parts.push({
            number: null,
            denomination: 0,
            bonus: '-@mod',
            types: [
                workflow.defaultDamageType
            ]
        });
        genericUtils.setProperty(itemData, 'flags.chris-premades.cleaveMastery', true);
        await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [selection]);
    } else {
        await workflowUtils.syntheticItemRoll(workflow.item, [selection]);
    }
}
async function graze({workflow}) {
    if (workflow.hitTargets.size) return;
    let mod = workflow.actor.system.abilities[workflow.activity.ability].mod;
    if (!mod) return;
    await workflowUtils.applyDamage([workflow.targets.first()], mod, workflow.defaultDamageType);
}
async function push({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (actorUtils.getSize(workflow.targets.first().actor, false) > 3) return;
    let selection = await dialogUtils.confirm('CHRISPREMADES.Mastery.Push.Name', 'CHRISPREMADES.Mastery.Push.Context');
    if (!selection) return;
    await tokenUtils.pushToken(workflow.token, workflow.targets.first(), 10);
}
async function sap({workflow}) {
    if (!workflow.hitTargets.size) return;
    let effectData = {
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        img: 'icons/skills/melee/sword-damaged-broken-red.webp',
        name: genericUtils.translate('CHRISPREMADES.Mastery.Sap.Name'),
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'combatEnd',
                    '1Attack'
                ],
                stackable: 'noneNameOnly'
            }
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function slow({workflow}) {
    if (!workflow.hitTargets.size) return;
    let effectData = {
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: genericUtils.handleMetric(-10),
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        img: 'icons/equipment/feet/boots-galosh-white.webp',
        name: genericUtils.translate('CHRISPREMADES.Mastery.Slow.Name'),
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'combatEnd'
                ],
                stackable: 'noneNameOnly'
            }
        }
    };
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
async function topple({workflow}) {
    if (!workflow.hitTargets.size) return;
    let selection = await dialogUtils.confirm('CHRISPREMADES.Mastery.Topple.Name', 'CHRISPREMADES.Mastery.Topple.Context');
    if (!selection) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, 'Mastery: Topple', {object: true, getDescription: true, flatDC: itemUtils.getSaveDC(workflow.item)});
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.targets.first()]);
}
async function vex({workflow}) {
    if (!workflow.hitTargets.size || (workflow.damageItem.oldHP === workflow.damageItem.newHP && workflow.damageItem.oldTempHP === workflow.damageItem.newTempHP)) return;
    let effectData = {
        changes: [
            {
                key: 'flags.midi-qol.advantage.attack.all',
                mode: 2,
                value: 'workflow.targets.first().id === "' + workflow.targets.first().id + '"',
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        img: 'icons/magic/control/fear-fright-mask-yellow.webp',
        name: genericUtils.translate('CHRISPREMADES.Mastery.Vex.Name'),
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'turnEndSource',
                    'combatEnd'
                ],
                stackable: 'multi'
            },
            'chris-premades': {
                mastery: {
                    vex: {
                        target: workflow.targets.first().id
                    }
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function RollComplete(workflow) {
    if (!workflow.targets.size || !workflow.item || !workflow.activity || !workflow.actor || !workflow.token) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    let effects = actorUtils.getEffects(workflow.actor).filter(i => i.flags['chris-premades']?.mastery?.vex?.target === workflow.targets.first().id);
    if (effects.length) await genericUtils.deleteEmbeddedDocuments(workflow.actor, 'ActiveEffect', effects.map(i => i.id));
    let baseItem = workflow.item.system.type.baseItem;
    if (baseItem === '') return;
    if (!workflow.actor.system.traits?.weaponProf?.mastery?.value?.has(baseItem)) return;
    let mastery = workflow.attackRoll.options.mastery;
    if (!mastery) return;
    let macro = custom.getMacro(mastery + 'Mastery', 'modern');
    if (!macro) return;
    try {
        await macro.masteryMacro({workflow});
    } catch (error) {
        console.error(error);
    }
}
async function combatEnd(combat) {
    await Promise.all(combat.combatants.map(async combatant => {
        if (!combatant.actor) return;
        await genericUtils.update(combatant.actor, {'flags.chris-premades.-=mastery': null});
    }));
}
export let masteries = {
    RollComplete,
    combatEnd
};
export let cleaveMastery = {
    name: 'Mastery: Cleave',
    version: '1.1.0',
    masteryMacro: cleave
};
export let grazeMastery = {
    name: 'Mastery: Graze',
    version: '1.1.0',
    masteryMacro: graze
};
export let pushMastery = {
    name: 'Mastery: Push',
    version: '1.1.0',
    masteryMacro: push
};
export let sapMastery = {
    name: 'Mastery: Sap',
    version: '1.1.0',
    masteryMacro: sap
};
export let slowMastery = {
    name: 'Mastery: Slow',
    version: '1.1.0',
    masteryMacro: slow
};
export let toppleMastery = {
    name: 'Mastery: Topple',
    version: '1.1.0',
    masteryMacro: topple
};
export let vexMastery = {
    name: 'Mastery: Vex',
    version: '1.1.0',
    masteryMacro: vex
};
