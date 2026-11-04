import {actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function use({document: effect, macroClass: {identifier, source}}) {
    const origin = await effectUtils.getOriginActivity(effect);
    const spell = await compendiumUtils.getSpell('command', {description: origin?.item.system.description.value, object: true});
    if (!spell) return Logging.addMacroWarning(source, identifier, `Mantle of Majesty could not find the Command spell in compendiums. (effect) ${effect.uuid}`);
    genericUtils.mergeObject(spell, {
        'flags.dnd5e.dependentOn': effect.uuid,
        name: `${origin?.item.name ?? ''}: ${spell.name}`,
        system: {'activation.type': 'special', method: 'innate'}
    });
    const macro = {source, rules: mantleOfMajesty.rules, identifier: 'mantleOfMajestyCommand'};
    if (spell.flags.cat?.macros?.roll)
        spell.flags.cat.macros.roll.push(macro);
    else
        genericUtils.setProperty(spell, 'flags.cat.macros.roll', [macro]);
    await workflowUtils.syntheticItemDataRoll(spell, effect.actor);
    spell.system.activation.type = 'bonus';
    await itemUtils.createItems(effect.actor, [spell], {favorite: true, parentEntity: effect});
}
async function command({workflow}) {
    for (const target of workflow.targets) {
        if (!target.actor) continue;
        if (!actorUtils.hasStatusFromActor(target.actor, ['charmed'], workflow.actor)) continue;
        workflowUtils.grantRollModifier(workflow, 'fail', target.id, workflow.item.name);
    }
}
async function recover({document: activity, config, macroClass: {identifier, source}}) {
    if (config.mantleOfMajesty) return;
    const minLevel = automationUtils.getConfigValue(activity.item, 'spellSlot');
    if (!actorUtils.hasSpellSlots(activity.actor, minLevel)) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.FontOfInspiration.NoSlots', {notify: 'warn'});
        return true;
    }
    const selection = await dialogUtils.selectSpellSlots(activity.actor, activity.item.name, 'CHRISPREMADES.Macros.Modern.FontOfInspiration.Prompt', {maxAmount: 1, maxAmountMode: 'count', minLevel});
    const target = activity.actor.system.spells[selection?.[0]?.key]?.level;
    if (!target) return true;
    const data = activity.toObject();
    data.consumption.targets = [
        {
            type: 'itemUses',
            value: '-1'
        },
        {
            target,
            type: 'spellSlots',
            value: '1'
        }
    ];
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, [], {config: {mantleOfMajesty: true}});
    return true;
}
export const mantleOfMajesty = {
    name: 'Mantle of Majesty',
    version: '2.1.7',
    rules: 'all',
    effect: [
        {
            pass: 'created',
            macro: use,
            priority: 50
        }
    ],
    config: {
        spellSlot: {
            default: '3',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.DivineSmite.Slot',
            get options() { return constants.spellSlotOptions.filter(o => o.value > 0); }
        }
    }
};
export const mantleOfMajestyCommand = {
    version: mantleOfMajesty.version,
    rules: mantleOfMajesty.rules,
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: command,
            priority: 50
        }
    ]
};
export const mantleOfMajestyRecover = {
    version: mantleOfMajesty.version,
    rules: '2024',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: recover,
            priority: 50
        }
    ]
};
