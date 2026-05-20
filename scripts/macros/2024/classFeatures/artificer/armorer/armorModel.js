import {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {start as enlargeReduceStart} from '../../../../2014/spells/enlargeReduce.js';
async function use({trigger, workflow}) {
    let currentModel = workflow.item.flags['chris-premades']?.armorModel?.model;
    let newModel = activityUtils.getIdentifier(workflow.activity);
    if (!newModel) return;
    if (currentModel) {
        let effect = effectUtils.getEffectByIdentifier(workflow.actor, currentModel);
        if (currentModel === newModel && effect) return;
        let oldEffect = ['dreadnaught', 'guardian', 'infiltrator'].find(identifier => effectUtils.getEffectByIdentifier(workflow.actor, identifier));
        if (oldEffect) await genericUtils.remove(effect);
    }
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'armorModel.model', newModel);
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, newModel);
    if (!sourceEffect) return;
    let effectData = sourceEffect.toObject();
    delete effectData._id;
    effectData.origin = sourceEffect.uuid;
    let names = {
        dreadnaught: 'Force Demolisher',
        guardian: 'Thunder Pulse',
        infiltrator: 'Lightning Launcher'
    };
    let itemData = await compendiumUtils.getItemFromCompendium(constants.modernFeaturePacks.classFeatureItems, names[newModel], {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ArmorModel.Model.' + newModel});
    if (!itemData) return;
    itemData.system.equipped = true;
    if (itemUtils.getItemByIdentifier(workflow.actor, 'improvedArmorer')) itemData.system.magicalBonus = 1;
    if (itemUtils.getItemByIdentifier(workflow.actor, 'perfectedArmor')) {
        switch (newModel) {
            case 'dreadnaught':
                itemData.system.damage.base.denomination = 6;
            // eslint-disable-next-line no-fallthrough
            case 'infiltrator':
                itemData.system.damage.base.number = 2;
        }
    }
    let vae = [];
    let unhideActivities;
    let modelActivities = {
        dreadnaught: 'giantStature',
        guardian: 'defensiveField'
    };
    let activityIdentifier = modelActivities[newModel];
    if (activityIdentifier) {
        const activity = activityUtils.getActivityByIdentifier(workflow.item, activityIdentifier, {strict: true});
        if (activity) {
            vae.push({
                type: 'use',
                name: activity.name,
                identifier: 'armorModel',
                activityIdentifier: activityIdentifier
            });
            unhideActivities = {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: [activityIdentifier],
                favorite: true
            };
        }
    }
    vae.unshift({
        type: 'use',
        name: genericUtils.translate('CHRISPREMADES.Macros.ArmorModel.Model.' + newModel)
    });
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {vae, unhideActivities, rules: 'modern'});
    await genericUtils.sleep(50); // The effect and item trying to make a favorite close together causes issue.
    await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, parentEntity: effect});
}
async function forceDemolisher({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!actorUtils.compareSize(workflow.actor, workflow.hitTargets.first().actor, '>')) return;
    let distance = tokenUtils.getDistance(workflow.token, workflow.hitTargets.first());
    let options = [['CHRISPREMADES.Macros.ArmorModel.Push10', 10], ['CHRISPREMADES.Macros.ArmorModel.Push5', 5], ['CHRISPREMADES.Generic.No', false]];
    if (distance >= 15) options.unshift(['CHRISPREMADES.Macros.ArmorModel.Pull10', -10]);
    if (distance >= 10) options.unshift(['CHRISPREMADES.Macros.ArmorModel.Pull5', -5]);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ArmorModel.PushPull', options, {displayAsRows: true});
    if (!selection) return;
    await tokenUtils.pushToken(workflow.token, workflow.hitTargets.first(), selection);
}
async function thunderPulseEffect({trigger: {entity: effect}, workflow}) {
    if (workflow.targets.size !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item?.actor) return;
    if (item.actor === workflow.targets.first().actor) return;
    workflow.tracker.disadvantage.add(effect.name, effect.name);
}
async function lightningLauncher({trigger, workflow}) {
    if (!workflow.item.system.uses.value || !workflow.token || !combatUtils.isOwnTurn(workflow.token) || !workflow.hitTargets.size) return;
    let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.ArmorModel.LightningLauncher.Use');
    if (!selection) return;
    await workflowUtils.bonusDamage(workflow, '1d6', {damageType: 'lightning'});
    if (combatUtils.inCombat()) await genericUtils.update(workflow.item, {'system.uses.spent': workflow.item.system.uses.spent + 1});
}
async function giantStature({trigger, workflow}) {
    if (!workflow.token) return;
    let perfectedArmor = itemUtils.getItemByIdentifier(workflow.actor, 'perfectedArmor');
    let currSize = actorUtils.getSize(workflow.actor);
    let effectData = {
        name: workflow.activity.name,
        img: workflow.activity.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.range.all',
                mode: 0,
                value: perfectedArmor ? 10 : 5,
                priority: 20
            }
        ]
    };
    if (perfectedArmor) {
        effectData.changes.push(...[
            {
                key: 'flags.midi-qol.advantage.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ]);
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck() === 'patreon';
    if (currSize < (perfectedArmor ? 4 : 3)) {
        let canBeLarge = currSize < 3 && Object.values(tokenUtils.checkForRoom(workflow.token, 1)).some(i => i);
        let newSize = canBeLarge ? 'lg' : false;
        if (perfectedArmor) {
            if (Object.values(tokenUtils.checkForRoom(workflow.token, 4 - Math.max(2, currSize))).some(i => i)) {
                if (canBeLarge) {
                    let selection = await dialogUtils.buttonDialog(perfectedArmor.name, 'CHRISPREMADES.Macros.Rage.LargeOrHuge', [
                        ['DND5E.SizeLarge', 'lg'],
                        ['DND5E.SizeHuge', 'huge']
                    ]);
                    if (selection) newSize = selection;
                } else {
                    let selection = await dialogUtils.confirm(perfectedArmor.name, 'CHRISPREMADES.Macros.Rage.Huge');
                    if (selection) newSize = 'huge';
                }
            }
        }
        if (newSize) {
            if (newSize === 'huge') perfectedArmor.displayCard();
            if (playAnimation) {
                genericUtils.setProperty(effectData, 'flags.chris-premades.enlargeReduce', {
                    selection: 'enlarge',
                    playAnimation: true,
                    origSize: actorUtils.getSize(workflow.actor, true),
                    newSize
                });
                genericUtils.setProperty(effectData, 'flags.chris-premades.effect.sizeAnimation', false);
            } else {
                effectData.changes.push({
                    key: 'system.traits.size',
                    mode: 5,
                    value: newSize,
                    priority: 20
                });
            }
        }
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        rules: 'modern',
        identifier: 'armorModelGiantStatureEffect'
    });
    if (playAnimation) await enlargeReduceStart({trigger: {entity: effect}});
}
export let armorModel = {
    name: 'Armor Model',
    version: '1.5.32',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['dreadnaught', 'guardian', 'infiltrator']
            },
            {
                pass: 'rollFinished',
                macro: giantStature,
                priority: 50,
                activities: ['giantStature']
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
        }
    ]
};
export let armorModelForceDemolisher = {
    name: 'Armor Model: Force Demolisher',
    version: armorModel.version,
    rules: armorModel.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: forceDemolisher,
                priority: 50
            }
        ]
    }
};
export let armorModelthunderPulseEffect = {
    name: 'Armor Model: Thunder Pulse Effect',
    version: armorModel.version,
    rules: armorModel.rules,
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
                macro: thunderPulseEffect,
                priority: 50
            }
        ]
    }
};
export let armorModelLightningLauncher = {
    name: 'Armor Model: Lightning Launcher',
    version: armorModel.version,
    rules: armorModel.rules,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: lightningLauncher,
                priority: 50
            }
        ]
    }
};