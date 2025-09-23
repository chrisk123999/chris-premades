import {activityUtils, actorUtils, animationUtils, combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
import {animation} from '../../../2014/classFeatures/rogue/sneakAttack.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item || !workflow.activity) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (!(workflowUtils.getActionType(workflow) === 'rwak' || workflow.item.system.properties.has('fin') || identifier === 'psychicBlades')) return;
    if (!item.system.uses.value) return;
    let doSneak = false;
    let rollType = (workflow.advantage && workflow.disadvantage) ? 'normal' : (workflow.advantage && !workflow.disadvantage) ? 'advantage' : (!workflow.advantage && workflow.disadvantage) ? 'disadvantage' : 'normal';
    if (rollType === 'advantage') doSneak = true;
    let targetToken = workflow.targets.first();
    if (!doSneak && rollType != 'disadvantage') {
        let nearbyTokens = tokenUtils.findNearby(targetToken, 5, 'enemy', {includeIncapacitated: false}).filter(i => i.id != workflow.token.id);
        if (nearbyTokens.length) doSneak = true;
    }
    if (!doSneak) return;
    let autoSneak = itemUtils.getConfig(item, 'auto');
    if (!autoSneak) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SneakAttack.Use', {name: item.name}));
        if (!selection) return;
    }
    if (combatUtils.inCombat()) {
        await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
        if (game.combat.round === 1 && itemUtils.getItemByIdentifier(workflow.actor, 'deathStrike')) genericUtils.setProperty(workflow, 'chris-premades.deathStrike', true);
    }
    let bonusDamageFormula = itemUtils.getConfig(item, 'formula');
    if (!bonusDamageFormula) {
        if (workflow.actor.type === 'character') {
            let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
            let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
            let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
            if (!scale) return;
            let number = scale.number;
            let cunningStrike = itemUtils.getItemByIdentifier(workflow.actor, 'cunningStrike');
            let improvedCunningStrike = itemUtils.getItemByIdentifier(workflow.actor, 'improvedCunningStrike');
            let deviousStrikes = itemUtils.getItemByIdentifier(workflow.actor, 'deviousStrikes');
            let envenomWeapons = itemUtils.getItemByIdentifier(workflow.actor, 'envenomWeapons');
            let supremeSneak = itemUtils.getItemByIdentifier(workflow.actor, 'supremeSneak');
            let documents = [];
            let uses = 0;
            if (cunningStrike) {
                documents.push(...cunningStrike.system.activities);
                uses += itemUtils.getConfig(cunningStrike, 'uses');
            }
            if (improvedCunningStrike) uses += itemUtils.getConfig(improvedCunningStrike, 'uses');
            if (deviousStrikes) documents.push(...deviousStrikes.system.activities);
            if (envenomWeapons) documents.unshift(...envenomWeapons.system.activities);
            if (supremeSneak) {
                let hidden = effectUtils.getEffectByIdentifier(workflow.actor, 'hideEffect');
                if (hidden) documents.unshift(...supremeSneak.system.activities);
            }
            if (documents.length) {
                let activities = [];
                let used = [];
                for (let i = 0; i < uses; i++) {
                    let availableActivities = documents.filter(activity => {
                        let identifier = activityUtils.getIdentifier(activity) ?? activity.id;
                        if ((activity.uses.max ?? 1) > number) return;
                        if (['poison', 'envenomPoison'].includes(identifier) && !workflow.actor.items.find(j => j.system.identifier === 'poisoners-kit')) return;
                        if (identifier === 'envenomPoisonOvertime') return;
                        if (identifier === 'poison' && envenomWeapons) return;
                        if (identifier === 'trip' && actorUtils.getSize(workflow.targets.first().actor) > 3) return;
                        if (used.includes(identifier)) return;
                        return activity;
                    });
                    if (!availableActivities.length) break;
                    let text = i > 0 ? 'CHRISPREMADES.Macros.CunningStrike.UseAnother' : 'CHRISPREMADES.Macros.CunningStrike.Use';
                    let selection = await dialogUtils.selectDocumentDialog(cunningStrike ? cunningStrike.name : deviousStrikes.name, text, availableActivities, {sortAlphabetical: true, addNoneDocument: true});
                    if (!selection) break;
                    let identifier = activityUtils.getIdentifier(selection) ?? selection.id;
                    if (!identifier) break;
                    number -= selection.uses.max;
                    activities.push(selection);
                    used.push(identifier);
                }
                if (activities.length) {
                    genericUtils.setProperty(workflow, 'chris-premades.cunningStrike.activities', []);
                    activities.forEach(activity => workflow['chris-premades'].cunningStrike.activities.push(activity.uuid));
                    if (activities.find(activity =>  activityUtils.getIdentifier(activity) === 'stealthAttack')) genericUtils.setProperty(workflow, 'chris-premades.supremeSneak.used', true);
                }
            }
            if (number) bonusDamageFormula = number + 'd' + scale.faces;
        } else if (workflow.actor.type === 'npc') {
            let number = Math.ceil(workflow.actor.system.details.cr / 2);
            bonusDamageFormula = number + 'd6';
        }
    }
    if (combatUtils.inCombat()) {
        let assassinate = itemUtils.getItemByIdentifier(workflow.actor, 'assassinate');
        if (assassinate && game.combat.round === 1) {
            let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
            bonusDamageFormula += ' + ' + workflow.actor.classes[classIdentifier].system.levels;
        }
    }
    if (bonusDamageFormula) await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: workflow.defaultDamageType});
    await workflowUtils.completeItemUse(item);
    let rendMind = itemUtils.getItemByIdentifier(workflow.actor, 'rendMind');
    if (rendMind && identifier === 'psychicBlades') {
        let psionicPower = itemUtils.getItemByIdentifier(workflow.actor, 'psionicPower');
        let selection;
        if (psionicPower?.system?.uses?.value >= 3 && !rendMind.system.uses.value) {
            selection = await dialogUtils.confirm(rendMind.name, genericUtils.format('CHRISPREMADES.Macros.RendMind.RestoreAndUse', {name: rendMind.name}));
            if (selection) {
                await genericUtils.update(psionicPower, {'system.uses.spent': psionicPower.system.uses.spent + 3});
                await genericUtils.update(rendMind, {'system.uses.spent': 0});
                let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rendMindRestoreEffect');
                if (effect) await genericUtils.remove(effect);
            }
        } else if (rendMind.system.uses.value) {
            selection = await dialogUtils.confirm(rendMind.name, genericUtils.format('CHRISPREMADES.Macros.SneakAttack.Use', {name: rendMind.name}));
        }
        if (selection) genericUtils.setProperty(workflow, 'chris-premades.rendMind.use', true);
    }
    let playAnimation = itemUtils.getConfig(item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    if (!playAnimation) return;
    let animationType;
    if (tokenUtils.getDistance(workflow.token, targetToken) > genericUtils.convertDistance(5)) animationType = 'ranged';
    if (!animationType) animationType = workflow.defaultDamageType;
    await animation(targetToken, workflow.token, animationType);
}
async function onHit({trigger, workflow}) {
    if (!workflow['chris-premades']?.rendMind?.use) return;
    let rendMind = itemUtils.getItemByIdentifier(workflow.actor, 'rendMind');
    if (!rendMind) return;
    let activity = activityUtils.getActivityByIdentifier(rendMind, 'use', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first()], {consumeResources: true, consumeUsage: true});
}
export let sneakAttack = {
    name: 'Sneak Attack',
    version: '1.3.32',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 215
            },
            {
                pass: 'rollFinished',
                macro: onHit,
                priority: 500
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
            value: 'auto',
            label: 'CHRISPREMADES.SneakAttack.Auto',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'rogue',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'sneak-attack',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '',
            category: 'homebrew',
            homebrew: true
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
                    identifier: 'sneak-attack',
                    type: 'dice',
                    scale: {
                        1: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        3: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        7: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        9: {
                            number: 5,
                            faces: 6,
                            modifiers: []
                        },
                        11: {
                            number: 6,
                            faces: 6,
                            modifiers: []
                        },
                        13: {
                            number: 7,
                            faces: 6,
                            modifiers: []
                        },
                        15: {
                            number: 8,
                            faces: 6,
                            modifiers: []
                        },
                        17: {
                            number: 9,
                            faces: 6,
                            modifiers: []
                        },
                        19: {
                            number: 10,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Sneak Attack',
                icon: null
            }
        }
        
    ]
};