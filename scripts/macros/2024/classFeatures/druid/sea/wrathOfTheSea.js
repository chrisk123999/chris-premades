import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let aquaticAffinity = itemUtils.getItemByIdentifier(workflow.actor, 'aquaticAffinity');
    let stormborn = itemUtils.getItemByIdentifier(workflow.actor, 'stormborn');
    let oceanicGift = itemUtils.getItemByIdentifier(workflow.actor, 'oceanicGift');
    let wildShape = itemUtils.getItemByIdentifier(workflow.actor, 'wildShape');
    if (!wildShape) return;
    let wisMod = Math.max(1, workflow.actor.system.abilities.wis.mod);
    let spellDC = workflow.actor.system.attributes.spell.dc;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.modernPacks.featureItems, 'Wrath of the Sea: Ongoing', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WrathOfTheSea.Ongoing', identifier: 'wrathOfTheSeaOngoing', flatDC: spellDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let activityId = Object.keys(featureData.system.activities)[0];
    featureData.system.activities[activityId].damage.parts[0].number = wisMod;
    if (aquaticAffinity) featureData.system.activities[activityId].range.value = '10';
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: []
    };
    if (stormborn) effectData.changes.push([
        {
            key: 'system.attributes.movement.fly',
            mode: 4,
            value: '@attributes.movement.walk',
            priority: 100
        },
        {
            key: 'system.traits.dr.value',
            mode: 2,
            value: 'cold',
            priority: 20
        },
        {
            key: 'system.traits.dr.value',
            mode: 2,
            value: 'lightning',
            priority: 20
        },
        {
            key: 'system.traits.dr.value',
            mode: 2,
            value: 'thunder',
            priority: 20
        }
    ]);
    let giveSelf = true;
    let giveAlly;
    let nearbyAllies = tokenUtils.findNearby(workflow.token, 60, 'ally');
    if (oceanicGift && nearbyAllies.length) {
        let buttons = [
            ['CHRISPREMADES.Macros.WrathOfTheSea.Self', 'self'],
            ['CHRISPREMADES.Macros.WrathOfTheSea.Ally', 'ally']
        ];
        if (wildShape.system.uses.value) buttons.push([genericUtils.format('CHRISPREMADES.Macros.WrathOfTheSea.Both', {itemName: wildShape.name}), 'both']);
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.WrathOfTheSea.Choose', buttons);
        if (selection === 'ally') giveSelf = false;
        if (['ally', 'both'].includes(selection)) {
            [giveAlly] = (await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.WrathOfTheSea.Choose', nearbyAllies)) ?? [];
        }
    }
    let tokens = [];
    if (giveSelf) tokens.push(workflow.token);
    if (giveAlly) tokens.push(giveAlly);
    if (!tokens.length) return;
    if (tokens.length > 1) await wildShape.update({'system.uses.spent': wildShape.system.uses.spent + 1});
    let initialFeatureData = genericUtils.duplicate(featureData);
    initialFeatureData.system.activities[activityId].activation.type = 'special';
    for (let token of tokens) {
        let effect = await effectUtils.createEffect(token.actor, effectData, {
            identifier: 'wrathOfTheSeaOngoing',
            vae: [{type: 'use', name: featureData.name, identifier: 'wrathOfTheSeaOngoing'}]
        });
        await itemUtils.createItems(token.actor, [featureData], {favorite: true, parentEntity: effect});
        let nearbyEnemies = tokenUtils.findNearby(token, aquaticAffinity ? 10 : 5, 'enemy');
        if (!nearbyEnemies.length) continue;
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.WrathOfTheSea.Target', nearbyEnemies);
        if (!selection?.length) continue;
        await workflowUtils.syntheticItemDataRoll(initialFeatureData, token.actor, [selection[0]]);
    }
}
async function push({workflow}) {
    let targetToken = workflow.failedSaves.first();
    if (!targetToken) return;
    if (actorUtils.getSize(targetToken.actor, false) > 3) return;
    await tokenUtils.pushToken(workflow.token, targetToken, 15);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['wrathOfTheSea'], 'wildShape');
}
export let wrathOfTheSea = {
    name: 'Wrath of the Sea',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};
export let wrathOfTheSeaOngoing = {
    name: 'Wrath of the Sea: Ongoing',
    version: wrathOfTheSea.version,
    rules: wrathOfTheSea.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: push,
                priority: 50
            }
        ]
    }
};