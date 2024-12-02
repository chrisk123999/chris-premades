import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let classLevel = workflow.actor.classes?.artificer?.system.levels ?? 1;
    let numUses = classLevel > 14 ? 3 : (classLevel > 5 ? 2 : 1);
    let elixirTypes = [
        'Healing',
        'Swiftness',
        'Resilience',
        'Boldness',
        'Flight',
        'Transformation'
    ];
    for (let i = 0; i < numUses; i++) {
        let roll = await new Roll('1d6').evaluate();
        let elixirType = elixirTypes[roll.total - 1] ?? 'Healing';
        roll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: genericUtils.translate('CHRISPREMADES.Macros.ExperimentalElixir.' + elixirType)
        });
        await elixirHelper(elixirType, workflow.actor);
    }
    let minSpellSlot = Object.entries(workflow.actor.system.spells).map(i => ({...i[1], type: i[0]})).filter(i => i.value > 0).reduce((lowest, curr) => curr.level < lowest.level ? curr : lowest, {level: 99});
    while (minSpellSlot.type) {
        let {value: slotValue, level: slotLevel, max: slotMax, type: slotType} = minSpellSlot;
        let buttons = elixirTypes.map(i => ['CHRISPREMADES.Macros.ExperimentalElixir.' + i, i]);
        buttons.splice(0, 0, ['CHRISPREMADES.Generic.No', 'no']);
        let dialogContent;
        if (slotType === 'pact') {
            dialogContent = genericUtils.format('CHRISPREMADES.Macros.ExperimentalElixir.MakeAnotherPact', {slotValue, slotMax});
        } else {
            dialogContent = genericUtils.format('CHRISPREMADES.Macros.ExperimentalElixir.MakeAnother', {slotLevel, slotValue, slotMax});
        } 
        let elixirType = await dialogUtils.buttonDialog(workflow.item.name, dialogContent, buttons);
        if (!elixirType?.length || elixirType === 'no') return;
        await elixirHelper(elixirType, workflow.actor);
        await genericUtils.update(workflow.actor, {['system.spells.' + slotType + '.value']: slotValue - 1});
        minSpellSlot = Object.entries(workflow.actor.system.spells).map(i => ({...i[1], type: i[0]})).filter(i => i.value > 0).reduce((lowest, curr) => curr.level < lowest.level ? curr : lowest, {level: 99});
    }
}
async function elixirHelper(elixirType, actor) {
    let existingItem = itemUtils.getItemByIdentifier(actor, 'experimentalElixir' + elixirType);
    if (existingItem) {
        genericUtils.update(existingItem, {'system.quantity': existingItem.system.quantity + 1});
    } else {
        let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Experimental Elixir: ' + elixirType, {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ExperimentalElixir.' + elixirType, identifier: 'experimentalElixir' + elixirType});
        if (!itemData) {
            errors.missingPackItem();
            return;
        }
        let mainActivityId = itemData.flags['chris-premades']?.activityIdentifiers.experimentalElixirMain;
        let tempActivityId = itemData.flags['chris-premades']?.activityIdentifiers.experimentalElixirHeal;
        if (elixirType === 'Healing') {
            itemData.system.activities[mainActivityId].healing.custom.formula = '2d4[healing] + ' + actor.system.abilities.int.mod;
        }
        if ((actor.classes?.artificer?.system.levels ?? 1) >= 9) {
            itemData.system.activities[tempActivityId].healing.custom.formula = '2d6[temphp] + ' + actor.system.abilities.int.mod;
            effectUtils.addMacro(itemData, 'midi.item', ['experimentalElixirConsumable']);
        }
        await itemUtils.createItems(actor, [itemData]);
    }
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.remove(item);
}
async function late({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'experimentalElixirMain') return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'experimentalElixirHeal', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, Array.from(workflow.targets));
}
export let experimentalElixir = {
    name: 'Experimental Elixir',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let experimentalElixirConsumable = {
    name: 'Experimental Elixir: Consumable',
    version: experimentalElixir.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ]
};