import {activityUtils, actorUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../utils.js';
import {rageRaging as rageRagingLegacy} from '../../../../legacyMacros.js';
async function early({trigger, workflow}) {
    if (itemUtils.getConfig(workflow.item, 'allowHeavyArmor')) return;
    let heavyArmor = workflow.actor.items.filter(item => item.system.type?.value === 'heavy' && item.system.equipped);
    if (!heavyArmor.length) return;
    genericUtils.notify('CHRISPREMADES.Macros.Rage.HeavyArmor', 'info');
    workflow.aborted = true;
}
async function use({trigger, workflow}) {
    if (!itemUtils.getConfig(workflow.item, 'allowConcentration')) {
        let concentrationEffects = Array.from(workflow.actor.concentration.effects);
        if (concentrationEffects.length) await Promise.all(concentrationEffects.map(async effect => await genericUtils.remove(effect)));
    }
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let continueRage = activityUtils.getActivityByIdentifier(workflow.item, 'rageContinue', {strict: true});
    if (!continueRage) return;
    let unhideActivities = [{
        itemUuid: workflow.item.uuid,
        activityIdentifiers: ['rageContinue'],
        favorite: true
    }];
    let vaeInput = [{
        type: 'use',
        name: continueRage.name,
        identifier: 'rage',
        activityIdentifier: 'rageContinue'
    }];
    let recklessAttack = itemUtils.getItemByIdentifier(workflow.actor, 'recklessAttack');
    if (recklessAttack) {
        vaeInput.push({
            type: 'use',
            name: recklessAttack.name,
            identifier: 'recklessAttack'
        });
    }
    let macros = [
        {
            type: 'effect',
            macros: ['rageRaging']
        },
        {
            type: 'midi.actor',
            macros: ['rageRaging']
        }
    ];
    let persistentRage = itemUtils.getItemByIdentifier(workflow.actor, 'persistentRage');
    if (!persistentRage) {
        macros.push(...[{
            type: 'combat',
            macros: ['rageUpkeep']
        },
        {
            type: 'midi.actor',
            macros: ['rageUpkeep']
        }]);
    } else {
        let specialDurations = effectData.flags['chris-premades']?.specialDuration ?? [];
        if (specialDurations.includes('incapacitated')) effectData.flags['chris-premades'].specialDuration = specialDurations.filter(i => i != 'incapacitated');
    }
    if (itemUtils.getConfig(workflow.item, 'allowHeavyArmor')) {
        let specialDurations = effectData.flags['chris-premades']?.specialDuration ?? [];
        if (specialDurations.includes('heavy')) effectData.flags['chris-premades'].specialDuration = specialDurations.filter(i => i != 'heavy');
    }
    if (itemUtils.getConfig(workflow.item, 'allowSpellcasting')) genericUtils.setProperty(effectData, 'flags.chris-premades.rage.allowSpellcasting', true);
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier');
    let formula = workflow.actor.system.scale?.[classIdentifier]?.[scaleIdentifier]?.formula;
    if (formula) genericUtils.setProperty(effectData, 'flags.chris-premades.rage.formula', formula);
    //Path of the Berserker
    let berserkerFrenzy = itemUtils.getItemByIdentifier(workflow.actor, 'mindlessRage');
    if (berserkerFrenzy) {
        macros.push({
            type: 'midi.actor',
            macros: ['berserkerFrenzyAttack']
        });
    }
    let mindlessRage = itemUtils.getItemByIdentifier(workflow.actor, 'mindlessRage');
    if (mindlessRage) {
        let charmedEffect = effectUtils.getEffectByStatusID(workflow.actor, 'charmed');
        if (charmedEffect) await genericUtils.remove(charmedEffect);
        let frightenedEffect = effectUtils.getEffectByStatusID(workflow.actor, 'frightened');
        if (frightenedEffect) await genericUtils.remove(frightenedEffect);
        let effect = mindlessRage.effects.contents?.[0];
        if (effect) effectData.changes.push(...effect.changes);
        if (charmedEffect || frightenedEffect) await workflowUtils.completeItemUse(mindlessRage);
    }
    let berserkerRetaliation = itemUtils.getItemByIdentifier(workflow.actor, 'berserkerRetaliation');
    if (berserkerRetaliation) {
        vaeInput.push({
            type: 'use',
            name: berserkerRetaliation.name,
            identifier: 'berserkerRetaliation'
        });
    }
    let intimidatingPresence = itemUtils.getItemByIdentifier(workflow.actor, 'intimidatingPresence');
    if (intimidatingPresence) {
        vaeInput.push({
            type: 'use',
            name: intimidatingPresence.name,
            identifier: 'intimidatingPresence'
        });
    }
    //Path of the Wild Heart
    let rageOfTheWilds = itemUtils.getItemByIdentifier(workflow.actor, 'rageOfTheWilds');
    if (rageOfTheWilds) {
        let selection = await dialogUtils.buttonDialog(rageOfTheWilds.name, 'CHRISPREMADES.Macros.RageOfTheWilds.Use', [
            ['CHRISPREMADES.Macros.RageOfTheWilds.Bear', 'bear'],
            ['CHRISPREMADES.Macros.RageOfTheWilds.Eagle', 'eagle'],
            ['CHRISPREMADES.Macros.RageOfTheWilds.Wolf', 'wolf']
        ], {displayAsRows: true});
        switch (selection) {
            case 'bear': {
                let effect = rageOfTheWilds.effects.contents?.[0];
                if (effect) effectData.changes.push(...effect.changes);
                break;
            }
            case 'wolf': {
                macros.push({
                    type: 'midi.actor',
                    macros: 'rageOfTheWildsWolf'
                });
                genericUtils.setProperty(effectData, 'flags.chris-premades.rageOfTheWildsWolf', true);
                break;
            }
        }
        await workflowUtils.completeItemUse(rageOfTheWilds);
    }
    let powerOfTheWilds = itemUtils.getItemByIdentifier(workflow.actor, 'powerOfTheWilds');
    if (powerOfTheWilds) {
        let options = [
            ['CHRISPREMADES.Macros.PowerOfTheWilds.Lion', 'lion'],
            ['CHRISPREMADES.Macros.PowerOfTheWilds.Ram', 'ram']
        ];
        let invalidTypes = ['heavy', 'medium', 'light'];
        let allArmor = workflow.actor.items.filter(item => invalidTypes.includes(item.system.type?.value) && item.system.equipped);
        if (!allArmor.length) options.unshift(['CHRISPREMADES.Macros.PowerOfTheWilds.Falcon', 'falcon']);
        let selection = await dialogUtils.buttonDialog(powerOfTheWilds.name, 'CHRISPREMADES.Macros.RageOfTheWilds.Use', options, {displayAsRows: true});
        switch (selection) {
            case 'falcon': {
                let effect = powerOfTheWilds.effects.contents?.[0];
                if (effect) effectData.changes.push(...effect.changes);
                break;
            }
            case 'lion': {
                macros.push({
                    type: 'midi.actor',
                    macros: ['powerOfTheWildsLion']
                });
                genericUtils.setProperty(effectData, 'flags.chris-premades.powerOfTheWildsLion', true);
                break;
            }
            case 'ram': {
                macros.push({
                    type: 'midi.actor',
                    macros: ['powerOfTheWildsRam']
                });
            }
        }
        await workflowUtils.completeItemUse(powerOfTheWilds);
    }
    //Path of the World Tree
    let vitalityOfTheTree = itemUtils.getItemByIdentifier(workflow.actor, 'vitalityOfTheTree');
    if (vitalityOfTheTree) {
        macros.push({
            type: 'combat',
            macros: ['lifeGivingForce']
        });
        let range = itemUtils.getConfig(vitalityOfTheTree, 'range');
        genericUtils.setProperty(effectData, 'flags.chris-premades.vitalityOfTheTree.range', range);
        await workflowUtils.completeItemUse(vitalityOfTheTree);
    }
    let branchesOfTheTree = itemUtils.getItemByIdentifier(workflow.actor, 'branchesOfTheTree');
    if (branchesOfTheTree) {
        vaeInput.push({
            type: 'use',
            name: branchesOfTheTree.name,
            identifier: 'branchesOfTheTree'
        });
    }
    let batteringRoots = itemUtils.getItemByIdentifier(workflow.actor, 'batteringRoots');
    if (batteringRoots) {
        macros.push({
            type: 'midi.actor',
            macros: ['batteringRootsAttack']
        });
    }
    let travelAlongTheTree = itemUtils.getItemByIdentifier(workflow.actor, 'travelAlongTheTree');
    if (travelAlongTheTree) {
        vaeInput.push({
            type: 'use',
            name: travelAlongTheTree.name,
            identifier: 'travelAlongTheTree'
        });
    }
    //Path of the Zealot
    let divineFury = itemUtils.getItemByIdentifier(workflow.actor, 'divineFury');
    if (divineFury) {
        macros.push({
            type: 'midi.actor',
            macros: ['divineFuryAttack']
        });
    }
    let warriorOfTheGods = itemUtils.getItemByIdentifier(workflow.actor, 'warriorOfTheGods');
    if (warriorOfTheGods) {
        vaeInput.push({
            type: 'use',
            name: warriorOfTheGods.name,
            identifier: 'warriorOfTheGods'
        });
    }
    let zealousPresence = itemUtils.getItemByIdentifier(workflow.actor, 'zealousPresence');
    if (zealousPresence) {
        vaeInput.push({
            type: 'use',
            name: zealousPresence.name,
            identifier: 'zealousPresence'
        });
    }
    let rageOfTheGods = itemUtils.getItemByIdentifier(workflow.actor, 'rageOfTheGods');
    effectData.origin = workflow.item.uuid;
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'rage',
        vae: vaeInput,
        unhideActivities,
        rules: 'modern',
        macros,
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
    let instinctivePounce = itemUtils.getItemByIdentifier(workflow.actor, 'instinctivePounce');
    if (instinctivePounce) await workflowUtils.completeItemUse(instinctivePounce);
    if (travelAlongTheTree) {
        let group = activityUtils.getActivityByIdentifier(travelAlongTheTree, 'group');
        let path = 'system.activities.' + group.id + '.uses.spent';
        if (group) await genericUtils.update(travelAlongTheTree, {[path]: 0});
        let selection = await dialogUtils.confirm(travelAlongTheTree.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: travelAlongTheTree.name}));
        if (selection) {
            let single = activityUtils.getActivityByIdentifier(travelAlongTheTree, 'single');
            let featureData = genericUtils.duplicate(travelAlongTheTree.toObject());
            if (single) featureData.system.activities[single.id].activation.type = 'special';
            if (group) featureData.system.activities[group.id].activation.type = 'special';
            await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, []);
        }
    }
    if (rageOfTheGods?.system?.uses?.value) {
        let selection = await dialogUtils.confirm(rageOfTheGods.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: rageOfTheGods.name}));
        if (selection) await workflowUtils.completeItemUse(rageOfTheGods);
    }
}
async function attack({trigger, workflow}) {
    if (!combatUtils.inCombat() || !workflow.token) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    if (!constants.attacks.includes(workflow.activity.actionType) || !workflow.targets.size) return;
    if (workflow.targets.first().document.disposition === workflow.token.document.disposition) return;
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function save({trigger, workflow}) {
    if (!combatUtils.inCombat() || !workflow.token) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    if (workflow.activity.actionType != 'save' || !workflow.targets.size) return;
    if (workflow.targets.first().document.disposition === workflow.token.document.disposition) return;
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let lastTurnString = effect.flags['chris-premades']?.rage?.turn;
    if (!lastTurnString) {
        combatUtils.setTurnCheck(effect, 'rage');
        return;
    }
    if (lastTurnString === '') lastTurnString = '0-0';
    let [lastRound, lastTurn] = lastTurnString.split('-').map(i => Number(i));
    let [currentRound, currentTurn] = combatUtils.currentTurn().split('-').map(i => Number(i));
    if (currentTurn === 0) lastRound++;
    let roundDiff = currentRound - lastRound;
    if (roundDiff >= 1) {
        let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.Rage.EndEarlyModern', {actorName: token.actor.name}), {userId: socketUtils.gmID()});
        if (!selection) return;
        await genericUtils.remove(effect);
    }
}
async function rageContinue({trigger, workflow}) {
    if (!combatUtils.inCombat()) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!effect) return;
    await combatUtils.setTurnCheck(effect, 'rage');
}
async function spellcasting({trigger: {entity: effect}, workflow}) {
    if (effect.flags['chris-premades']?.rage?.allowSpellcasting) return;
    if (workflow.item.type != 'spell') return;
    genericUtils.notify('CHRISPREMADES.Macros.Rage.Spellcasting', 'info');
    workflow.aborted = true;
}
async function combatEnd({trigger: {entity: effect}}) {
    await combatUtils.setTurnCheck(effect, 'rage', true);
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (workflow.activity.ability != 'str') return;
    let formula = effect.flags['chris-premades']?.rage?.formula;
    if (!formula) return;
    await workflowUtils.bonusDamage(workflow, String(formula), {damageType: workflow.defaultDamageType});
}
export let rage = {
    name: 'Rage',
    version: '1.1.22',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50,
                activities: ['rage']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['rage']
            },
            {
                pass: 'rollFinished',
                macro: rageContinue,
                priority: 50,
                activities: ['rageContinue']
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
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: [
                {
                    value: 'default',
                    label: 'CHRISPREMADES.Config.Animations.Default',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'lightning',
                    label: 'CHRISPREMADES.Config.Animations.Lightning',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'saiyan',
                    label: 'CHRISPREMADES.Config.Animations.Saiyan',
                    requiredModules: ['jb2a_patreon']
                },
            ]
        },
        {
            value: 'allowSpellcasting',
            label: 'CHRISPREMADES.Macros.Rage.AllowSpellcasting',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'allowConcentration',
            label: 'CHRISPREMADES.Macros.Rage.AllowConcentration',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'allowHeavyArmor',
            label: 'CHRISPREMADES.Macros.Rage.AllowHeavyArmor',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'rage-damage',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'tokenImg',
            label: 'CHRISPREMADES.Config.TokenImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'tokenImgPriority',
            label: 'CHRISPREMADES.Config.TokenImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        },
        {
            value: 'avatarImg',
            label: 'CHRISPREMADES.Config.AvatarImg',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'avatarImgPriority',
            label: 'CHRISPREMADES.Config.AvatarImgPriority',
            type: 'number',
            default: 50,
            category: 'visuals'
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'rage-damage',
                    type: 'number',
                    scale: {
                        1: {
                            value: 2
                        },
                        9: {
                            value: 3
                        },
                        16: {
                            value: 4
                        }
                    }
                },
                value: {},
                title: 'Rage Damage',
                icon: null
            }
        }
        
    ]
};
export let rageRaging = {
    name: rage.name,
    version: rage.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: spellcasting,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    },
    effect: [
        {
            pass: 'created',
            macro: rageRagingLegacy.effect[0].macro,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: rageRagingLegacy.effect[1].macro,
            priority: 50
        }
    ]
};
export let rageUpkeep = {
    name: rage.name,
    version: rage.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: save,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        },
        {
            pass: 'combatEnd',
            macro: combatEnd,
            priority: 50
        }
    ]
};