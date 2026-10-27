import {actorUtils, applications, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, Logging, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
async function rage({data, document: item, macroClass: {identifier, source}}) {
    const powerOfTheWilds = (await automationUtils.calledEvent('powerOfTheWilds', item.actor, {multiResult: true, canOverlap: true}))
        .flat().filter(a => a instanceof dnd5e.dataModels.activity.BaseActivityData);
    const choices = powerOfTheWilds?.length ? 
        await dualChoice(Array.from(item.system.activities), powerOfTheWilds) :
        await singleChoice(Array.from(item.system.activities));
    if (!choices?.length) return Logging.addMacroWarning(source, identifier, `Rage of the Wilds exited early due to a declined rage effect prompt. (actor) ${item.actor.uuid}`);
    const delayed = [], favorites = [];
    for (const choice of choices) {
        await documentUtils.setFlag(choice.item, source, 'wildHeart.previous', choice.identifier);
        data.effectData.system.changes.push({key: `flags.${source}.wildHeart.${choice.identifier}`, type: 'override', value: true});
        switch(choice.identifier) {
            case 'rage-bear': {
                for (const value of automationUtils.getConfigValue(item, 'resistances')) 
                    data.effectData.changes.push({
                        key: 'system.traits.dr.value', type: 'add', value
                    });
                break;
            }
            case 'rage-lion': {
                const macro = {source, rules: '2024', identifier: 'lionAttack'};
                genericUtils.setProperty(data.effectData, `flags.${source}.lion.name`, `${choice.item.name}: ${choice.name}`);
                if (data.effectData.flags.cat?.macros?.roll)
                    data.effectData.flags.cat.macros.roll.push(macro);
                else 
                    genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
                break;
            }
            case 'rage-ram':
                favorites.push(choice);
                break;
            case 'rage-eagle':
                favorites.push(choice);
            // eslint-disable-next-line no-fallthrough
            case 'rage-wolf':
            case 'rage-falcon':
                delayed.push(choice);
                break;
            default:
                Logging.addMacroWarning(source, identifier, `Rage of the Wilds ran an unrecognized rage effect. (identifier) ${choice.identifier} (actor) ${item.actor.uuid}`);
                await workflowUtils.syntheticActivityRoll(choice);
                break;
        }
    }
    if (delayed.length) genericUtils.setProperty(data.effectData, `flags.${source}.wildHeart.delayed`, delayed.map(a => a.uuid));
    if (favorites.length) {
        genericUtils.setProperty(data.effectData, `flags.${source}.wildHeart.favorites`, favorites.map(f => f.uuid));
        await actorUtils.addFavorites(item.actor, favorites);
        const macro = {source, rules: rageOfTheWilds.rules, identifier: 'rageOfTheWildsUnfavorite'};
        if (data.effectData.flags.cat?.macros?.effect)
            data.effectData.flags.cat.macros.effect.push(macro);
        else 
            genericUtils.setProperty(data.effectData, 'flags.cat.macros.effect', [macro]);
    }
}
async function rageBegin({data, macroClass: {identifier, source}}) {
    const delayedEffects = data.effect.flags[source]?.wildHeart?.delayed;
    if (!delayedEffects?.length) return;
    for (const uuid of delayedEffects) {
        const activity = await fromUuid(uuid);
        if (!activity) continue;
        switch(activity.identifier) {
            case 'rage-eagle': {
                if (!await dialogUtils.confirm(activity.item.name, 'CHRISPREMADES.Macros.Modern.RageOfTheWilds.Eagle')) break;
                await workflowUtils.specialItemUse(activity.item, [], activity.item, {activity});
                break;
            }
            case 'rage-wolf': {
                const wolf = documentUtils.getEffectByIdentifier(activity.item, 'rageWolf')?.toObject();
                if (!wolf) {
                    Logging.addMacroWarning(source, identifier, `Rage of the Wilds: Wolf exited early without locating its active effect. (item) ${activity.item.uuid}`);
                    break;
                }
                await effectUtils.createEffects(activity.actor, [wolf], {parentEntity: data.effect});
                break;
            }
            case 'rage-falcon': {
                const falcon = documentUtils.getEffectByIdentifier(activity.item, 'rageFalcon')?.toObject();
                if (!falcon) {
                    Logging.addMacroWarning(source, identifier, `Rage of the Wilds: Falcon exited early without locating its active effect. (item) ${activity.item.uuid}`);
                    break;
                }
                await effectUtils.createEffects(activity.actor, [falcon], {parentEntity: data.effect});
                break;
            }
        }
    }
}
async function makeInputs(list) {
    const prev = list[0].item.flags['chris-premades']?.wildHeart?.previous;
    const inputs = await Promise.all(list.map(async a => ({
        label: a.name,
        name: a.identifier,
        options: {
            tooltip: await uiUtils.enrichHTML(a.description.value || a.item.system.description.value, a.getRollData()),
            isChecked: a.identifier === prev,
            image: a.img
        }
    })));
    if (!inputs.some(i => i.options.isChecked)) inputs[0].options.isChecked = true;
    return inputs;
}
async function dualChoice(options, extras) {
    const choices = await applications.DialogApp.dialog(
        options[0].item.name,
        'CHRISPREMADES.Macros.Modern.RageOfTheWilds.Dual',
        [
            ['radio', await makeInputs(options), {legend: options[0].item.name, radioName: 'rage'}],
            ['radio', await makeInputs(extras), {legend: extras[0].item.name, radioName: 'power'}]
        ],
        'okCancel'
    );
    if (!choices?.buttons) return;
    return [
        options.find(a => a.identifier === choices.rage),
        extras.find(a => a.identifier === choices.power)
    ].filter(Boolean);
}
async function singleChoice(options) {
    const choice = await dialogUtils.selectDocumentDialog(options[0].item.name, 'CHRISPREMADES.Macros.Modern.RageOfTheWilds.Single', options, {displayTooltips: true, addNoneDocument: true});
    if (choice) return [choice];
}
async function preCheck({document: activity, macroClass: {identifier, source}}) {
    if (activity.actor.flags[source]?.wildHeart?.[activity.identifier]) return;    
    Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.RageOfTheWilds.Active', {notify: 'warn', format: {type: activity.name}});
    return true;
}
async function unfavorite({document: effect, macroClass: {source}}) {
    const favorites = (await Promise.all((effect.flags[source]?.wildHeart?.favorites ?? []).map(f => fromUuid(f)))).filter(Boolean);
    if (favorites.length) await actorUtils.removeFavorites(effect.actor, favorites);
}
export const rageOfTheWilds = {
    name: 'Rage of the Wilds',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: rage,
            priority: 250
        },
        {
            pass: 'actorRageBegin',
            macro: rageBegin,
            priority: 250
        }
    ],
    config: {
        resistances: {
            default: ['acid', 'bludgeoning', 'cold', 'fire', 'lightning', 'piercing', 'poison', 'slashing', 'thunder'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.InfuseItem.Resistance',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
export const rageOfTheWildsPreCheck = {
    version: rageOfTheWilds.version,
    rules: rageOfTheWilds.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preCheck,
            priority: 50
        }
    ]
};
export const rageOfTheWildsUnfavorite = {
    version: rageOfTheWilds.version,
    rules: rageOfTheWilds.rules,
    effect: [
        {
            pass: 'deleted',
            macro: unfavorite,
            priority: 50
        }
    ]
};
