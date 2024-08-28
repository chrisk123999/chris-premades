import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'twilightSanctuary');
    if (effect) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'combat', ['twilightSanctuaryActive']);
    if (itemUtils.getItemByIdentifier(workflow.actor, 'twilightShroud')) effectUtils.addMacro(effectData, 'midi.actor', ['twilightShroudActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'twilightSanctuary'});
}
async function turnEnd({trigger: {entity: effect, token, target}}) {
    if (!target) target = token;
    let charmed = effectUtils.getEffectByStatusID(target.actor, 'charmed');
    let frightened = effectUtils.getEffectByStatusID(target.actor, 'frightened');
    let classLevel = token.actor.classes.cleric?.system?.levels ?? 0;
    let formula = '1d6[temphp] + ' + classLevel;
    let buttons = [
        [genericUtils.format('CHRISPREMADES.Macros.TwilightSanctuary.Heal', {formula}), 'hp']
    ];
    if (charmed) buttons.push(['CHRISPREMADES.Macros.TwilightSanctuary.Charmed', 'charmed']);
    if (frightened) buttons.push(['CHRISPREMADES.Macros.TwilightSanctuary.Frightened', 'frightened']);
    buttons.push(['DND5E.None', false]);
    let userId = socketUtils.firstOwner(token, true);
    if (!userId) return;
    let selection = await dialogUtils.buttonDialog(effect.name, 'CHRISPREMADES.Dialog.WhatDo', buttons, {userId});
    if (!selection) return;
    if (selection === 'hp') {
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Twilight Sanctuary: Temporary HP', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.TwilightSanctuary.Temp'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        featureData.system.damage.parts[0][0] = formula;
        await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [target]);
    } else if (selection === 'charmed') {
        await genericUtils.remove(charmed);
    } else if (selection === 'frightened') {
        await genericUtils.remove(frightened);
    }
}
export let twilightSanctuary = {
    name: 'Channel Divinity: Twilight Sanctuary',
    version: '0.12.40',
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
export let twilightSanctuaryActive = {
    name: 'Channel Divinity: Twilight Sanctuary Active',
    version: twilightSanctuary.version,
    combat: [
        {
            pass: 'turnEndNear',
            macro: turnEnd,
            priority: 50,
            distance: 30,
            disposition: 'ally'
        },
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};