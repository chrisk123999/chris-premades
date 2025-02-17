import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
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
        duration: targetEffectData.duration,
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
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'wardingBondDismiss', {strict: true});
    if (!feature) return;
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        identifier: 'wardingBondSource', 
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'wardingBond', 
            activityIdentifier: 'wardingBondDismiss'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['wardingBondDismiss'],
            favorite: true
        }
    });
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, targetEffectData, {identifier: 'wardingBondTarget', parentEntity: effect, interdependent: true});
    }));
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wardingBondSource');
    if (!effect) return;
    await genericUtils.remove(effect);
}
async function onHit({trigger: {token, entity: effect}, workflow}) {
    if (workflow.hitTargets.size === 0 || !workflow.damageList) return;
    let bondUuid = effect.flags['chris-premades']?.wardingBond?.bondUuid;
    if (!bondUuid) return;
    let bond = await fromUuid(bondUuid);
    if (!bond) return;
    let damageInfo = workflow.damageList.find(i => i.actorId === token.actor.id);
    if (!damageInfo) return;
    let appliedDamage = Math.floor(damageInfo.damageDetail.reduce((acc, i) => acc + i.value, 0)) ?? 0;
    if (appliedDamage <= 0) return;
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'wardingBondDamage', {strict: true});
    if (!feature) return;
    await activityUtils.setDamage(feature, appliedDamage.toString());
    let targetWorkflow = await workflowUtils.syntheticActivityRoll(feature, [bond.object]);
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
    let selection = await dialogUtils.confirm(trigger.entity.name, 'CHRISPREMADES.Macros.WardingBond.Distance', {userId: socketUtils.gmID()});
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
    let selection = await dialogUtils.confirm(trigger.entity.name, 'CHRISPREMADES.Macros.WardingBond.Distance', {userId: socketUtils.gmID()});
    if (!selection) return;
    await genericUtils.remove(trigger.entity);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let wardingBond = {
    name: 'Warding Bond',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['wardingBond']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['wardingBondDismiss']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['wardingBondDismiss']
            }
        ]
    },
    config: [
        {
            value: 'maxDistance',
            label: 'CHRISPREMADES.Macros.WardingBond.MaxDistance',
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