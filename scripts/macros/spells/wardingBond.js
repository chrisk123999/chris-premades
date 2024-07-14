import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 3600
        },
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.traits.dr.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+1',
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.save',
                mode: 2,
                value: '+1',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                wardingBond: {
                    bondUuid: workflow.token.document.uuid,
                    maxDistance: itemUtils.getConfig(workflow.item, 'maxDistance')
                },
                macros: {
                    movement: ['wardingBondTarget'],
                    midi: {
                        actor: ['wardingBondTarget']
                    }
                }
            }
        }
    };
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 3600
        },
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                wardingBond: {
                    bondUuids: Array.from(workflow.targets).map(i => i.document.uuid),
                    maxDistance: itemUtils.getConfig(workflow.item, 'maxDistance')
                },
                macros: {
                    movement: ['wardingBondSource']
                }
            }
        }
    };
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Warding Bond: Dismiss', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.wardingBond.dismiss', identifier: 'wardingBondDismiss'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {identifier: 'wardingBondSource'});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, targetEffectData, {identifier: 'wardingBondTarget', parentEntity: effect, interdependent: true});
    }));
}
async function onHit({trigger, workflow}) {
    if (workflow.hitTargets.size === 0 || !workflow.damageList) return;
    let effect = effectUtils.getEffectByIdentifier(trigger.token.actor, 'wardingBondTarget');
    if (!effect) return;
    let bondUuid = effect.flags['chris-premades']?.wardingBond?.bondUuid;
    if (!bondUuid) return;
    let bond = await fromUuid(bondUuid);
    if (!bond) return;
    let damageInfo = workflow.damageList.find(i => i.actorId === trigger.token.actor.id);
    if (!damageInfo) return;
    if (damageInfo.appliedDamage === 0) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Warding Bond: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.wardingBond.damage'});
    if (!featureData) return;
    featureData.system.damage.parts[0][0] = damageInfo.appliedDamage;
    let targetWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [bond.object]);
    if (targetWorkflow.targets.first().actor.system.attributes.hp.value != 0) return;
    await genericUtils.remove(effect);
}
async function movedTarget({trigger}) {
    let bondUuid = trigger.entity.flags['chris-premades']?.wardingBond?.bondUuid;
    let maxDistance = trigger.entity.flags['chris-premades']?.wardingBond?.maxDistance;
    if (!bondUuid || !maxDistance) return;
    let bond = await fromUuid(bondUuid);
    if (!bond) return;
    let distance = tokenUtils.getDistance(bond, trigger.token);
    if (distance <= maxDistance) return;
    let selection = await dialogUtils.confirm(trigger.entity.name, 'CHRISPREMADES.macros.wardingBond.distance', {userId: socketUtils.gmID()});
    if (!selection) return;
    await genericUtils.remove(trigger.entity);
}
async function movedSource({trigger}) {
    let bondUuids = trigger.entity.flags['chris-premades']?.wardingBond?.bondUuids;
    let maxDistance = trigger.entity.flags['chris-premades']?.wardingBond?.maxDistance;
    if (!bondUuids || !maxDistance) return;
    let distantBond = (await Promise.all(bondUuids.map(async i => {
        let bond = await fromUuid(i);
        if (!bond) return false;
        let distance = tokenUtils.getDistance(trigger.token, bond.object);
        if (distance > maxDistance) return true;
        return false;
    }))).find(j => j);
    if (!distantBond) return;
    let selection = await dialogUtils.confirm(trigger.entity.name, 'CHRISPREMADES.macros.wardingBond.distance', {userId: socketUtils.gmID()});
    if (!selection) return;
    await genericUtils.remove(trigger.entity);
}
async function dismiss({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wardingBondSource');
    if (!effect) return;
    await genericUtils.remove(effect);
}
export let wardingBond = {
    name: 'Warding Bond',
    version: '0.12.0',
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
            value: 'maxDistance',
            label: 'CHRISPREMADES.macros.wardingBond.maxDistance',
            type: 'text',
            default: 60,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let wardingBondTarget = {
    name: 'Warding Bond Target',
    version: wardingBond.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: onHit,
                priority: 50
            }
        ]
    },
    movement: [
        {
            pass: 'moved',
            macro: movedTarget,
            priority: 50
        }
    ]
};
export let wardingBondSource = {
    name: 'Warding Bond Source',
    version: wardingBond.version,
    movement: [
        {
            pass: 'moved',
            macro: movedSource,
            priority: 50
        }
    ]
};
export let wardingBondDismiss = {
    name: 'Warding Bond Dismiss',
    version: wardingBond.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50
            }
        ]
    }
};