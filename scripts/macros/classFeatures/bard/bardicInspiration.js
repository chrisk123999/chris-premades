import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier') ?? 'inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: workflow.item.name}), 'warn');
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                'bardicInspiration': {
                    formula: scale.die
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'save', ['bardicInspirationInspired']);
    effectUtils.addMacro(effectData, 'skill', ['bardicInspirationInspired']);
    effectUtils.addMacro(effectData, 'check', ['bardicInspirationInspired']);
    effectUtils.addMacro(effectData, 'midi.actor', ['bardicInspirationInspired']);
    let moteOfPotential = itemUtils.getItemByIdentifier(workflow.actor, 'moteOfPotential');
    if (moteOfPotential) {
        effectData.flags['chris-premades'].moteOfPotential = {
            name: moteOfPotential.name,
            saveDC: itemUtils.getSaveDC(workflow.item),
            damageType: itemUtils.getConfig(moteOfPotential, 'damageType') ?? 'thunder',
            chaMod: workflow.actor.system.abilities.cha.mod
        };
    }
    let magicalInspiration = itemUtils.getItemByIdentifier(workflow.actor, 'magicalInspiration');
    if (magicalInspiration) {
        effectData.flags['chris-premades'].bardicInspiration.magical = magicalInspiration.name;
    }
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {identifier: 'bardicInspirationInspired'});
}
async function attack({trigger: {entity: effect}, workflow}) {
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
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
        let activityId = Object.keys(featureData.system.activities)[0];
        featureData.system.activities[activityId].damage.parts[0].bonus = bardResult;
        featureData.system.activities[activityId].damage.types = [moteOfPotential.damageType];
        let targets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally', {includeToken: true});
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, targets);
    }
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell');
    if (!workflow.hitTargets.size && constants.spellAttacks.includes(workflow.activity.actionType)) return;
    let {formula: bardDice, magical} = effect.flags['chris-premades'].bardicInspiration;
    if (!magical?.length) return;
    let result = await dialogUtils.selectTargetDialog(effect.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: magical}), workflow.targets);
    if (!result) return;
    let [token] = result;
    let defaultDamageType = workflow.defaultDamageType;
    let damageRoll = await new CONFIG.Dice.DamageRoll(bardDice, {}, {type: defaultDamageType}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: magical
    });
    let damageTotal = damageRoll.total;
    await genericUtils.update(effect, {'flags.chris-premades.bardicInspiration': {magicalTarget: token.id, magicalDamage: damageTotal}});
}
async function applyDamage({trigger: {entity: effect}, ditem}) {
    let {magicalTarget, magicalDamage} = effect.flags['chris-premades'].bardicInspiration;
    if (magicalTarget !== ditem.tokenId || !magicalDamage) return;
    ditem.rawDamageDetail[0].value += magicalDamage;
    let modifiedTotal = magicalDamage * (ditem.damageDetail[0].active.multiplier ?? 1);
    ditem.damageDetail[0].value += modifiedTotal;
    ditem.hpDamage += modifiedTotal;
    await genericUtils.remove(effect);
}
async function checkBonus({trigger: {roll, entity: effect}}) {
    let d20Roll = roll.dice.find(i => i.faces == 20).results.find(i => i.active).result;
    if (d20Roll === 1) return;
    let chrisFlags = effect.flags['chris-premades'];
    let potentialFormula = chrisFlags.moteOfPotential ? ('2' + chrisFlags.bardicInspiration.formula + 'kh') : ('1' + chrisFlags.bardicInspiration.formula);
    let detailsText = effect.name + ' (' + potentialFormula + ')';
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: detailsText, rollTotal: roll.total}));
    if (!selection) return;
    await genericUtils.remove(effect);
    return await rollUtils.addToRoll(roll, potentialFormula);
}
async function saveBonus({trigger: {saveId, roll, actor, entity: effect}}) {
    let d20Roll = roll.dice.find(i => i.faces == 20).results.find(i => i.active).result;
    if (d20Roll === 1) return;
    let oldTotal = roll.total;
    let chrisFlags = effect.flags['chris-premades'];
    let potentialFormula = '1' + chrisFlags.bardicInspiration.formula;
    let detailsText = effect.name + ' (' + potentialFormula + ')';
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: detailsText, rollTotal: oldTotal}));
    if (!selection) return;
    let moteOfPotential = chrisFlags.moteOfPotential;
    await genericUtils.remove(effect);
    let newRoll = await rollUtils.addToRoll(roll, potentialFormula);
    if (moteOfPotential) {
        let toHeal = newRoll.total - oldTotal + chrisFlags.moteOfPotential.chaMod;
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Mote of Potential Heal', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BardicInspiration.MoteHeal'});
        if (!featureData) return;
        featureData.system.damage.parts = [
            [toHeal + '[temphp]', 'temphp']
        ];
        let token = actorUtils.getFirstToken(actor);
        if (!token) return;
        await workflowUtils.syntheticItemDataRoll(featureData, actor, [token]);
    }
    return newRoll;
}
export let bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '1.1.0',
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
            default: 'inspiration',
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
    },
    save: [
        {
            pass: 'bonus',
            macro: saveBonus,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: checkBonus,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: checkBonus,
            priority: 50
        }
    ]
};