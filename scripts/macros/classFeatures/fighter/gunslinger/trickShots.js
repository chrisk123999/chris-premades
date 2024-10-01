import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, templateUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function skillBullying({trigger: {entity: item, skillId, options}}) {
    if (skillId !== 'itm') return;
    if (options.advantage) return;
    let feature = itemUtils.getItemByIdentifier(item.actor, 'adeptMarksman');
    if (!feature?.system.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseExtraCost', {itemName: item.name, quantity: 1, quantityName: genericUtils.translate('CHRISPREMADES.Firearm.Grit')}));
    if (!selection) return;
    await genericUtils.update(feature, {'system.uses.value': feature.system.uses.value - 1});
    options.advantage = true;
}
async function lateHelper(workflow, effect, featureName) {
    await genericUtils.remove(effect);
    await genericUtils.sleep(100);
    if (workflow.hitTargets.size !== 1) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, featureName, {object: true, getDescription: true, translate: effect.name, flatDC: itemUtils.getSaveDC(originItem)});
    let targetToken = workflow.hitTargets.first();
    return await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
}
async function lateDazing({trigger: {entity: effect}, workflow}) {
    await lateHelper(workflow, effect, 'Dazing Shot');
}
async function lateDisarming({trigger: {entity: effect}, workflow}) {
    await lateHelper(workflow, effect, 'Disarming Shot');
}
async function lateForceful({trigger: {entity: effect}, workflow}) {
    let saveWorkflow = await lateHelper(workflow, effect, 'Forceful Shot');
    if (!saveWorkflow?.failedSaves?.size) return;
    await tokenUtils.pushToken(workflow.token, saveWorkflow.failedSaves.first(), 15);
}
async function usePiercing({workflow}) {
    let adeptMarksman = itemUtils.getItemByIdentifier(workflow.actor, 'adeptMarksman');
    let currUses = adeptMarksman?.system.uses.value;
    if (!currUses) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoGrit', 'info');
        return;
    }
    let weapons = workflow.actor.items.filter(i => i.system.type?.value === 'firearm' && i.system.uses.value && !itemUtils.getConfig(i, 'status'));
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoGuns', 'info');
        return;
    }
    let weapon;
    if (weapons.length === 1) weapon = weapons[0];
    if (!weapon) weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Firearm.SelectUse', weapons);
    if (!weapon) return;
    let templateData = {
        distance: weapon.system.range.value,
        t: 'ray',
        width: 5,
        user: game.user,
        fillColor: game.user.color
    };
    let {template, tokens} = await templateUtils.placeTemplate(templateData, true);
    tokens = Array.from(tokens).filter(i => i.id !== workflow.token.id);
    if (!tokens.length) return;
    await genericUtils.remove(template);
    let distances = tokens.map(i => ({token: i, distance: tokenUtils.getDistance(workflow.token, i)}));
    let minDist = Math.min(...distances.map(i => i.distance));
    let firstInd = distances.findIndex(i => i.distance === minDist);
    let firstTarget = distances[firstInd].token;
    let remainingTargets = distances.toSpliced(firstInd, 1).map(i => i.token);
    await genericUtils.update(weapon, {'system.uses.value': weapon.system.uses.value - 1});
    await genericUtils.update(adeptMarksman, {'system.uses.value': currUses - 1});
    let itemToUse = weapon.clone({'flags.chris-premades.config.misfire': Number(weapon.flags['chris-premades'].config.misfire) + 1, 'flags.chris-premades.firearm.piercing': true}, {keepId: true});
    itemToUse.prepareData();
    itemToUse.prepareFinalAttributes();
    itemToUse.applyActiveEffects();
    let firstWorkflow = await workflowUtils.syntheticItemRoll(itemToUse, [firstTarget]);
    if (!firstWorkflow.hitTargets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    itemToUse = weapon.clone({'flags.chris-premades.config.misfire': -100, 'flags.chris-premades.firearm.piercing': true, 'system.consume.amount': 0}, {keepId: true});
    itemToUse.prepareData();
    itemToUse.prepareFinalAttributes();
    itemToUse.applyActiveEffects();
    for (let target of remainingTargets) {
        await workflowUtils.syntheticItemRoll(itemToUse, [target]);
    }
    await genericUtils.remove(effect);
}
async function lateWinging({trigger: {entity: effect}, workflow}) {
    await lateHelper(workflow, effect, 'Winging Shot');
}
export let bullyingShot = {
    name: 'Bullying Shot',
    version: '1.0.2',
    skill: [
        {
            pass: 'situational',
            macro: skillBullying,
            priority: 50
        }
    ]
};
export let dazingShot = {
    name: 'Dazing Shot',
    version: '1.0.2',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateDazing,
                priority: 50
            }
        ]
    }
};
export let deadeyeShot = {
    name: 'Deadeye Shot',
    version: '1.0.2'
};
export let disarmingShot = {
    name: 'Disarming Shot',
    version: '1.0.2',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateDisarming,
                priority: 50
            }
        ]
    }
};
export let forcefulShot = {
    name: 'Forceful Shot',
    version: '1.0.2',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateForceful,
                priority: 50
            }
        ]
    }
};
export let piercingShotTrickshot = {
    name: 'Piercing Shot',
    version: '1.0.2',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: usePiercing,
                priority: 50
            }
        ]
    }
};
export let violentShot = {
    name: 'Violent Shot',
    version: '1.0.2'
};
export let wingingShot = {
    name: 'Winging Shot',
    version: '1.0.2',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateWinging,
                priority: 50
            }
        ]
    }
};