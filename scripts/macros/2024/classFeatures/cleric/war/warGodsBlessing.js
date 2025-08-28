import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let shieldOfFaith = itemUtils.getItemByIdentifier(workflow.actor, 'shieldOfFaith') ?? (await compendiumUtils.getItemFromCompendium(constants.modernPacks.spells, 'Shield of Faith'));
    let spiritualWeapon = itemUtils.getItemByIdentifier(workflow.actor, 'spiritualWeapon') ?? (await compendiumUtils.getItemFromCompendium(constants.modernPacks.spells, 'Spiritual Weapon'));
    if (!shieldOfFaith || !spiritualWeapon) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.ChooseASpell', [shieldOfFaith, spiritualWeapon]);
    if (!selection) return;
    let identifier = genericUtils.getIdentifier(selection);
    let selectionData = genericUtils.duplicate(selection.toObject());
    selectionData._id = foundry.utils.randomID();
    selectionData.system.activation.type = 'special';
    selectionData.system.duration.units = 'minute';
    selectionData.system.duration.value = '1';
    selectionData.system.properties = selectionData.system.properties.filter(i => i != 'concentration');
    selectionData.system.method = 'atwill';
    genericUtils.setProperty(selectionData, 'flags.chris-premades.warGodsBlessing.name', selectionData.name);
    genericUtils.setProperty(selectionData, 'flags.chris-premades.warGodsBlessing.identifier', identifier);
    effectUtils.addMacro(selectionData, 'midi.actor', ['warGodsBlessingCast']);
    let effectData = {
        name: selection.name + ' ' + genericUtils.translate('CHRISPREMADES.Generic.Source'),
        img: selection.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(selection),
        flags: {
            'chris-premades': {
                specialDuration: [
                    'incapacitated',
                    'dead'
                ]
            }
        }
    };
    if (identifier === 'shieldOfFaith') {
        let selectionWorkflow = await workflowUtils.syntheticItemDataRoll(selectionData, workflow.actor, workflow.targets.size ? Array.from(workflow.targets) : [workflow.token]);
        let sourceEffect = selection.effects.contents?.[0];
        if (!sourceEffect) return;
        let targetEffect = actorUtils.getEffects(selectionWorkflow.targets.first().actor).find(effect => effect.name === sourceEffect.name);
        if (!targetEffect) return;
        await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: targetEffect, interdependent: true, rules: 'modern', identifier: 'shieldOfFaithWarGodsBlessing', macros: [
            {
                type: 'midi.actor',
                macros: ['warGodsBlessingCast']
            }
        ]});
    } else {
        let effect = await effectUtils.createEffect(workflow.actor, effectData, {rules: 'modern', identifier: 'spiritualWeaponWarGodsBlessing', macros: [
            {
                type: 'midi.actor',
                macros: ['warGodsBlessingCast']
            }
        ]});
        selectionData.system.uses.max = '1';
        selectionData.system.uses.spent = 1;
        let items = await itemUtils.createItems(workflow.actor, [selectionData], {favorite: true, parentEntity: effect});
        await workflowUtils.syntheticItemRoll(items[0], []);
        let spiritualWeaponEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
        if (!spiritualWeaponEffect) return;
        await effectUtils.addDependent(effect, [spiritualWeaponEffect]);
        await effectUtils.addDependent(spiritualWeaponEffect, [effect]);
    }
}
async function cast({trigger, workflow}) {
    if (!workflow.activity || !workflow.item) return;
    if (workflow.item.type != 'spell') return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    let effect;
    switch (identifier) {
        case 'shieldOfFaith': effect = effectUtils.getEffectByIdentifier(workflow.actor, 'shieldOfFaithWarGodsBlessing'); break;
        case 'spiritualWeapon': {
            let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
            if (activityIdentifier === 'spiritualWeaponAttack') return;
            effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeaponWarGodsBlessing');
            break;
        }
        default: return;
    }
    if (effect) genericUtils.remove(effect);
}
async function added({trigger: {entity: item, actor}}) {
    let channelDivinity = itemUtils.getItemByIdentifier(actor, 'channelDivinity');
    if (!channelDivinity) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].consumption.targets[0].target = channelDivinity.id;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: itemData.system.activities[activity.id].consumption.targets});
}
export let warGodsBlessing = {
    name: 'War God\'s Blessing',
    version: '1.3.30',
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
        }
    ]
};
export let warGodsBlessingCast = {
    name: 'War God\'s Blessing: Cast',
    version: warGodsBlessing.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: cast,
                priority: 50
            }
        ]
    }
};