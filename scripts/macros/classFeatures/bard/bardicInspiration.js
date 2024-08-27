import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier') ?? 'bardic-inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: workflow.item.name}), 'warn');
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.optional.BardicInspiration.label',
                mode: 5,
                value: workflow.item.name,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.BardicInspiration.save.all',
                mode: 5,
                value: scale.formula,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.BardicInspiration.check.all',
                mode: 5,
                value: scale.formula,
                priority: 20
            },
            {
                key: 'flags.midi-qol.optional.BardicInspiration.skill.all',
                mode: 5,
                value: scale.formula,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                'bardicInspiration': {
                    formula: scale.formula
                }
            }
        }
    };
    let moteOfPotential = itemUtils.getItemByIdentifier(workflow.actor, 'moteOfPotential');
    if (moteOfPotential) {
        effectData.changes[2].value = '2' + scale.die + 'kh';
        effectData.changes[3].value = '2' + scale.die + 'kh';
        effectData.flags['chris-premades'].moteOfPotential = {
            saveDC: itemUtils.getSaveDC(workflow.item),
            damageType: itemUtils.getConfig(moteOfPotential, 'damageType') ?? 'thunder'
        };
        effectData.changes.push({
            key: 'flags.midi-qol.optional.BardicInspiration.macroToCall',
            mode: 5,
            value: 'function.chrisPremades.macros.moteOfPotential.utilFunctions.use',
            priority: 20
        });
    }
    effectUtils.addMacro(effectData, 'midi.actor', ['bardicInspirationInspired']);
    let magicalInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'magicalInspiration');
    if (magicalInspiration) {
        effectData.flags['chris-premades'].bardicInspiration.magical = magicalInspiration.name;
    }
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {identifier: 'bardicInspirationInspired'});
}
async function attack({workflow}) {
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bardicInspirationInspired');
    if (!effect) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: effect.name, attackTotal: workflow.attackTotal}));
    if (!selection) return;
    let bardDice = effect.flags['chris-premades'].bardicInspiration.formula;
    await genericUtils.remove(effect);
    await workflowUtils.bonusAttack(workflow, bardDice);
    let moteOfPotential = effect.flags['chris-premades'].moteOfPotential;
    if (moteOfPotential) {
        let bardResult = workflow.attackRoll.terms.at(-1).total;
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Mote of Potential Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BardicInspiration.MoteAttack', flatDC: moteOfPotential.saveDC});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        featureData.system.damage.parts = [
            [
                bardResult + '[' + moteOfPotential.damageType + ']',
                moteOfPotential.damageType
            ]
        ];
        let targets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally', {includeToken: true});
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, targets);
    }
}
async function damage({workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell');
    if (!workflow.hitTargets.size && constants.spellAttacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bardicInspirationInspired');
    if (!effect) return;
    let {formula: bardDice, magical} = effect.flags['chris-premades'].bardicInspiration;
    if (!magical?.length) return;
    let result = await dialogUtils.selectTargetDialog(effect.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: magical}), workflow.targets);
    if (!result) return;
    let [{document: token}] = result;
    let defaultDamageType = workflow.defaultDamageType;
    let damageRoll = await new CONFIG.Dice.DamageRoll(bardDice + '[' + defaultDamageType + ']', {}, {type: defaultDamageType}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: magical
    });
    let damageTotal = damageRoll.total;
    await genericUtils.update(effect, {'flags.chris-premades.bardicInspiration': {magicalTarget: token.id, magicalDamage: damageTotal}});
}
async function applyDamage({workflow, ditem}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'bardicInspirationInspired');
    if (!effect) return;
    let {magicalTarget, magicalDamage} = effect.flags['chris-premades'].bardicInspiration;
    if (magicalTarget !== ditem.tokenId || !magicalDamage) return;
    ditem.rawDamageDetail[0].value += magicalDamage;
    let modifiedTotal = magicalDamage * (ditem.damageDetail[0].active.multiplier ?? 1);
    ditem.damageDetail[0].value += modifiedTotal;
    ditem.hpDamage += modifiedTotal;
    await genericUtils.remove(effect);
}
export let bardicInspiration = {
    name: 'Bardic Inspiration',
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
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'mechanics'
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'mechanics'
        }
    ]
};
export let bardicInspirationInspired = {
    name: 'Bardic Inspiration: Inspired',
    version: bardicInspiration.version,
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 50
            }
        ]
    }
};