import {activityUtils, animationUtils, combatUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
import {animation} from '../../../2014/classFeatures/rogue/sneakAttack.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item || !workflow.activity) return;
    if (!(workflow.activity.actionType === 'rwak' || workflow.item.system.properties.has('fin'))) return;
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
    if (combatUtils.inCombat()) await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    let bonusDamageFormula = itemUtils.getConfig(item, 'formula');
    if (!bonusDamageFormula) {
        if (workflow.actor.type === 'character') {
            let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
            let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
            let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
            if (!scale) return;
            let number = scale.number;
            let cunningStrike = itemUtils.getItemByIdentifier(workflow.actor, 'cunningStrike');
            let deviousStrikes = itemUtils.getItemByIdentifier(workflow.actor, 'deviousStrikes');
            let documents = [];
            let uses = 0;
            if (cunningStrike) {
                documents.push(...cunningStrike.system.activities);
                uses += itemUtils.getConfig(cunningStrike, 'uses');
            }
            if (deviousStrikes) {
                documents.push(...deviousStrikes.system.activities);
                uses += itemUtils.getConfig(deviousStrikes, 'uses');
            }
            if (documents.length) {
                uses = Math.min(uses, number);
                let selection;
                if (uses > 1) {
                    selection = await dialogUtils.selectDocumentsDialog(cunningStrike ? cunningStrike.name : deviousStrikes.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: cunningStrike ? cunningStrike.name : deviousStrikes.name}), documents, {max: uses, sortAlphabetical: true, checkbox: true});
                    if (!selection) {
                        selection = [];
                    } else {
                        selection = selection.filter(i => i.amount).map(i => i.document);
                    }
                } else {
                    selection = await dialogUtils.selectDocumentDialog(cunningStrike ? cunningStrike.name : deviousStrikes.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: cunningStrike ? cunningStrike.name : deviousStrikes.name}), documents, {sortAlphabetical: true, addNoneDocument: true});
                    selection = [selection];
                }
                selection = selection.filter(i => i);
                if (selection.length) genericUtils.setProperty(workflow, 'chris-premades.cunningStrike.activities', []);
                selection.forEach(activity => {
                    let identifier = activityUtils.getIdentifier(activity);
                    if (!identifier) return;
                    let cost = 0;
                    switch (identifier) {
                        case 'poison':
                        case 'trip':
                        case 'withdraw': cost = 1; break;
                        case 'daze': cost = 2; break;
                        case 'knockOut': cost = 6; break;
                        case 'obscure': cost = 3; break;
                    }
                    if (number - cost >= 0) {
                        number -= cost;
                        workflow['chris-premades'].cunningStrike.activities.push(activity.uuid);
                    }
                });
            }
            if (number) bonusDamageFormula = number + 'd' + scale.faces;
        } else if (workflow.actor.type === 'npc') {
            let number = Math.ceil(workflow.actor.system.details.cr / 2);
            bonusDamageFormula = number + 'd6';
        }
    }
    if (bonusDamageFormula) await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: workflow.defaultDamageType});
    await workflowUtils.completeItemUse(item);
    let playAnimation = itemUtils.getConfig(item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let animationType;
    if (tokenUtils.getDistance(workflow.token, targetToken) > 5) animationType = 'ranged';
    if (!animationType) animationType = workflow.defaultDamageType;
    await animation(targetToken, workflow.token, animationType);
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