import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let spellData = await compendiumUtils.getItemFromCompendium(constants.modernPacks.spells, 'Command', {object: true});
    delete spellData._id;
    let key = genericUtils.getCPRSetting('spellCompendium');
    let pack = game.packs.get(key);
    if (pack) {
        let itemData = await compendiumUtils.getItemFromCompendium(key, 'Command', {ignoreNotFound: true, object: true});
        if (itemData) {
            spellData.system.description = itemData.system.description;
        }
    }
    spellData.system.activation.type = 'special';
    spellData.system.method = 'innate';
    genericUtils.setProperty(spellData, 'flags.chris-premades.info.identifier', 'mantleOfMajestyCommand');
    genericUtils.setProperty(spellData, 'flags.chris-premades.info.version', mantleOfMajesty.version);
    spellData.name = workflow.item.name + ': ' + spellData.name;
    effectUtils.addMacro(spellData, 'midi.item', ['mantleOfMajestyCommand']);
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        vae: [
            {
                type: 'use',
                name: spellData.name,
                identifier: 'mantleOfMajestyCommand'
            }
        ],
        concentrationItem: workflow.item,
        avatarImg: itemUtils.getConfig(workflow.item, 'avatarImg'),
        tokenImg: itemUtils.getConfig(workflow.item, 'tokenImg'),
        avatarImgPriority: itemUtils.getConfig(workflow.item, 'avatarImgPriority'),
        tokenImgPriority: itemUtils.getConfig(workflow.item, 'tokenImgPriority')
    });
    await workflowUtils.syntheticItemDataRoll(spellData, workflow.actor, Array.from(workflow.targets));
    spellData.system.activation.type = 'bonus';
    await itemUtils.createItems(workflow.actor, [spellData], {favorite: true, parentEntity: effect, section: workflow.item.name});
}
async function commandEarly({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        if (!(await actorUtils.hasConditionBy(workflow.actor, token.actor, 'charmed'))) return;
        await effectUtils.createEffect(token.actor, constants.autoFailSaveEffectData, {animate: false});
    }));
}
async function veryEarly({activity, dialog, actor, config}) {
    if (activity.item.system.uses.value) return;
    dialog.configure = false;
    if (!actorUtils.hasSpellSlots(actor, 3)) return;
    let selection = await dialogUtils.selectSpellSlot(actor, activity.item.name, 'CHRISPREMADES.Generic.ConsumeSpellSlotToUse', {minLevel: 3, no: true});
    if (!selection) return true;
    await genericUtils.update(actor, {['system.spells.spell' + selection + '.value']: actor.system.spells['spell' + selection].value - 1});
    genericUtils.setProperty(config, 'consume.resources', false);
}
export let mantleOfMajesty = {
    name: 'Mantle of Majesty',
    version: '1.1.43',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50
            }
        ]
    },
    config: [
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
    ]
};
export let mantleOfMajestyCommand = {
    name: 'Mantle of Majesty: Command',
    version: mantleOfMajesty.version,
    rules: mantleOfMajesty.rules,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: commandEarly,
                priority: 50
            }
        ]
    }
};