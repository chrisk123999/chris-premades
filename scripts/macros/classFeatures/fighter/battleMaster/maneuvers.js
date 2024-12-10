import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
import {proneOnFail} from '../../../generic/proneOnFail.js';
import {determineSuperiorityDie} from './superiorityDice.js';

async function useBaitAndSwitch({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    if (targetToken.id === workflow.token.id || targetToken.document.disposition * workflow.token.document.disposition < 0) return;
    let [itemToUse, superiorityDie] = await determineSuperiorityDie(workflow.actor);
    if (!itemToUse?.system.uses.value) return;
    let superiorityRoll = await new Roll(superiorityDie + ' + @abilities.dex.mod', workflow.actor.getRollData()).evaluate();
    superiorityRoll.toMessage({
        rollType: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Maneuvers.BaitSwitchAC', [
        ['CHRISPREMADES.Generic.You', false],
        ['DND5E.Target', true]
    ]);
    if (!selection) selection = false;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            rounds: 1
        },
        changes: [
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: superiorityRoll.total,
                priority: 20
            }
        ],
    };
    let sourceUpdate = {
        _id: workflow.token.document.id,
        x: targetToken.document.x,
        y: targetToken.document.y
    };
    let targetUpdate = {
        _id: targetToken.document.id,
        x: workflow.token.document.x,
        y: workflow.token.document.y
    };
    await genericUtils.update(itemToUse, {'system.uses.spent': itemToUse.system.uses.spent + 1});
    await genericUtils.updateEmbeddedDocuments(workflow.token.scene, 'Token', [sourceUpdate, targetUpdate]);
    await effectUtils.createEffect(selection ? targetToken.actor : workflow.actor, effectData);
}
async function useBrace({workflow}) {
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.token.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.activities.getByType('attack').some(j => j.actionType === 'mwak'));
    if (!weapons.length) return;
    let [itemToUse, superiorityDie] = await determineSuperiorityDie(workflow.actor);
    if (!itemToUse?.system.uses.value) return;
    let selected;
    if (weapons.length === 1) {
        selected = weapons[0];
    } else {
        selected = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Antagonize.SelectWeapon', weapons);
    }
    if (!selected) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: superiorityDie,
                priority: 20
            }
        ]
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    await workflowUtils.syntheticItemRoll(selected, [workflow.targets.first()]);
    if (effect) await genericUtils.remove(effect);
    await genericUtils.update(itemToUse, {'system.uses.spent': itemToUse.system.uses.spent + 1});
}
async function useCommandersStrike({workflow}) {
    let [itemToUse, superiorityDie] = await determineSuperiorityDie(workflow.actor);
    if (!itemToUse?.system.uses.value) return;
    let allies = workflow.token.scene.tokens.filter(i => i.disposition === workflow.token.document.disposition && i.id !== workflow.token.document.id && !actorUtils.hasUsedReaction(i.actor) && tokenUtils.canSense(i, workflow.token)).map(i => i.object);
    if (!allies.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Maneuvers.NoNearby', 'info');
        return;
    }
    let selected;
    if (allies.length > 1) {
        selected = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Maneuvers.CommanderSelect', allies);
        if (!selected?.length || !selected[1]) return;
        selected = selected[0].document;
    }
    if (!selected) {
        selected = allies[0];
    }
    let willUse = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.Maneuvers.CommanderConfirm', {userId: socketUtils.firstOwner(selected, true)});
    if (!willUse) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'system.bonuses.weapon.damage',
                mode: 2,
                value: superiorityDie,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Attack'
                ]
            }
        }
    };
    await effectUtils.createEffect(selected.actor, effectData);
    await actorUtils.setReactionUsed(selected.actor);
    await genericUtils.update(itemToUse, {'system.uses.spent': itemToUse.system.uses.spent + 1});
}
async function useDistractingStrike({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetActor = workflow.targets.first()?.actor;
    if (!targetActor) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            rounds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 0,
                value: 'targetActorUuid !== "' + workflow.actor.uuid + '"',
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnStartSource',
                    'isAttacked'
                ]
            }
        }
    };
    await effectUtils.createEffect(targetActor, effectData);
}
async function useGoadingAttack({workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetActor = workflow.targets.first()?.actor;
    if (!targetActor) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            rounds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 0,
                value: 'targetActorUuid !== "' + workflow.actor.uuid + '"',
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'turnEndSource'
                ]
            }
        }
    };
    await effectUtils.createEffect(targetActor, effectData);
}
async function useGrapplingStrike({workflow}) {
    let target = workflow.targets.first();
    if (!target) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'grapple');
    let featureData;
    if (!feature) {
        featureData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Grapple', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Grapple'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
    }
    let superiorityDie = workflow.actor.system.scale?.['battle-master']?.['combat-superiority-die']?.die ?? 'd6';
    let useSmall = genericUtils.getProperty(workflow.actor, 'flags.chris-premades.useSmallSuperiorityDie');
    if (useSmall) superiorityDie = 'd6';
    let superiorityRoll = await new Roll(superiorityDie).evaluate();
    superiorityRoll.toMessage({
        rollType: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    let rollTotal = superiorityRoll.total;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.skills.ath.bonuses.check',
                mode: 2,
                value: rollTotal,
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    if (feature) {
        await workflowUtils.syntheticItemRoll(feature, [target]);
    } else {
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [target]);
    }
    await genericUtils.remove(effect);
}
async function useManeuveringAttack({workflow}) {
    // TODO: This. Probably by letting the ally teleport
}
async function useParry({workflow}) {
    let [itemToUse, superiorityDie] = await determineSuperiorityDie(workflow.actor);
    if (!itemToUse?.system.uses.value) return;
    let superiorityRoll = await new Roll(superiorityDie + ' + @abilities.dex.mod', workflow.actor.getRollData()).evaluate();
    superiorityRoll.toMessage({
        rollType: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'system.traits.dm.midi.all',
                mode: 2,
                value: '-' + superiorityRoll.total,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Reaction'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
    await genericUtils.update(itemToUse, {'system.uses.spent': itemToUse.system.uses.spent + 1});
}
async function usePushingAttack({workflow}) {
    let targetToken = workflow.targets.first();
    let targetActor = targetToken?.actor;
    if (!targetActor) return;
    if (actorUtils.getSize(targetActor) > 3) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'pushingAttackAttack', {strict: true});
    if (!feature) return;
    let pushWorkflow = await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
    if (!pushWorkflow.failedSaves.size) return;
    let buttons = [5, 10, 15].map(i => [genericUtils.format('CHRISPREMADES.Distance.DistanceFeet', {distance: i}), i]);
    let distance = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Maneuvers.PushDistance', buttons);
    if (!distance) return;
    await tokenUtils.pushToken(workflow.token, targetToken, distance);
}
async function useSweepingAttack({workflow}) {
    if (!workflow.targets.size) return;
    let superiorityDie = workflow.actor.system.scale?.['battle-master']?.['combat-superiority-die']?.die ?? 'd6';
    let useSmall = genericUtils.getProperty(workflow.actor, 'flags.chris-premades.useSmallSuperiorityDie');
    if (useSmall) superiorityDie = 'd6';
    let {currAttackRoll, currDamageType, currRange} = workflow.item.flags['chris-premades']?.sweepingAttack ?? {};
    if (!currAttackRoll) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'sweepingAttackAttack', {strict: true});
    if (!feature) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally');
    let realNearbyTargets = tokenUtils.findNearby(workflow.token, currRange, 'enemy').filter(i => nearbyTargets.includes(i));
    if (!realNearbyTargets.length) return;
    let target;
    if (realNearbyTargets.length > 1) {
        target = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Maneuvers.SelectTarget', realNearbyTargets);
        if (!target?.length || !target[1]) return;
        target = target[0].document;
    }
    if (!target) {
        target = realNearbyTargets[0];
    }
    await activityUtils.setDamage(feature, superiorityDie, [currDamageType]);
    await workflowUtils.syntheticActivityRoll(feature, [target]);
}
async function sweepingAttackAttack({workflow}) {
    let currAttackRoll = workflow.item.flags['chris-premades']?.sweepingAttack?.currAttackRoll;
    if (!currAttackRoll) return;
    let replacementRoll = await new Roll(String(currAttackRoll)).evaluate();
    await workflow.setAttackRoll(replacementRoll);
}
async function useTripAttack({workflow}) {
    let targetToken = workflow.targets.first();
    let targetActor = targetToken?.actor;
    if (!targetActor) return;
    if (actorUtils.getSize(targetActor) > 3) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'tripAttackAttack', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [targetToken]);
}
export let maneuversAmbush = {
    name: 'Maneuvers: Ambush',
    version: '1.1.0'
};
export let maneuversBaitAndSwitch = {
    name: 'Maneuvers: Bait and Switch',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useBaitAndSwitch,
                priority: 50
            }
        ]
    }
};
export let maneuversBrace = {
    name: 'Maneuvers: Brace',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useBrace,
                priority: 50
            }
        ]
    }
};
export let maneuversCommandersStrike = {
    name: 'Maneuvers: Commander\'s Strike',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useCommandersStrike,
                priority: 50
            }
        ]
    }
};
export let maneuversCommandingPresence = {
    name: 'Maneuvers: Commanding Presence',
    version: '1.1.0'
};
export let maneuversDisarmingAttack = {
    name: 'Maneuvers: Disarming Attack',
    version: '1.1.0'
};
export let maneuversDistractingStrike = {
    name: 'Maneuvers: Distracting Strike',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useDistractingStrike,
                priority: 50
            }
        ]
    }
};
export let maneuversEvasiveFootwork = {
    name: 'Maneuvers: Evasive Footwork',
    version: '1.1.0'
};
export let maneuversFeintingAttack = {
    name: 'Maneuvers: Feinting Attack',
    version: '1.1.0'
};
export let maneuversGoadingAttack = {
    name: 'Maneuvers: Goading Attack',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useGoadingAttack,
                priority: 50
            }
        ]
    }
};
export let maneuversGrapplingStrike = {
    name: 'Maneuvers: Grappling Strike',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useGrapplingStrike,
                priority: 50
            }
        ]
    }
};
export let maneuversLungingAttack = {
    name: 'Maneuvers: Lunging Attack',
    version: '1.1.0'
};
export let maneuversManeuveringAttack = {
    name: 'Maneuvers: Maneuvering Attack',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useManeuveringAttack,
                priority: 50
            }
        ]
    }
};
export let maneuversMenacingAttack = {
    name: 'Maneuvers: Menacing Attack',
    version: '1.1.0'
};
export let maneuversParry = {
    name: 'Maneuvers: Parry',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useParry,
                priority: 50
            }
        ]
    }
};
export let maneuversPrecisionAttack = {
    name: 'Maneuvers: Precision Attack',
    version: '1.1.0'
};
export let maneuversPushingAttack = {
    name: 'Maneuvers: Pushing Attack',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: usePushingAttack,
                priority: 50,
                activities: ['maneuversPushingAttack']
            }
        ]
    }
};
export let maneuversQuickToss = {
    name: 'Maneuvers: Quick Toss',
    version: '1.1.0'
};
export let maneuversRally = {
    name: 'Maneuvers: Rally',
    version: '1.1.0'
};
export let maneuversRiposte = {
    name: 'Maneuvers: Riposte',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useBrace,
                priority: 50
            }
        ]
    }
};
export let maneuversSweepingAttack = {
    name: 'Maneuvers: Sweeping Attack',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useSweepingAttack,
                priority: 50,
                activities: ['maneuversSweepingAttack']
            },
            {
                pass: 'postAttackRoll',
                macro: sweepingAttackAttack,
                priority: 50,
                activities: ['sweepingAttackAttack']
            }
        ]
    }
};
export let maneuversTacticalAssessment = {
    name: 'Maneuvers: Tactical Assessment',
    version: '1.1.0'
};
export let maneuversTripAttack = {
    name: 'Maneuvers: Trip Attack',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useTripAttack,
                priority: 50,
                activities: ['maneuversTripAttack']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['tripAttackAttack']
            }
        ]
    }
};