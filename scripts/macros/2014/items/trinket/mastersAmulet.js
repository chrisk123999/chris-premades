import {activityUtils, actorUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    if (!targetActor) return;
    let bound = itemUtils.getItemByIdentifier(targetActor, 'shieldGuardianBound');
    if (!bound) {
        genericUtils.notify('CHRISPREMADES.Macros.MastersAmulet.MissingBound', 'warn');
        return;
    }
    if (!targetActor.prototypeToken.actorLink) {
        genericUtils.notify('CHRISPREMADES.Macros.MastersAmulet.Unlinked', 'warn');
    }
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'mastersAmulet.actorUuid', targetActor.uuid);
    genericUtils.notify('CHRISPREMADES.Macros.MastersAmulet.Linked', 'info');
}
async function damageApplication({trigger, workflow, ditem}) {
    if (!itemUtils.getEquipmentState(trigger.entity)) return;
    if (!workflow.hitTargets.has(trigger.token)) return;
    if (ditem.oldHP <= ditem.newHP && ditem.newTempHP >= ditem.oldTempHP) return;
    let actorUuid = trigger.entity.flags['chris-premades']?.mastersAmulet?.actorUuid;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    let firstToken = actorUtils.getFirstToken(actor);
    if (!firstToken) return;
    let distance = tokenUtils.getDistance(trigger.token, firstToken, {wallsBlock: false, checkCover: false});
    let maxDistance = Number(itemUtils.getConfig(trigger.entity, 'distance'));
    if (distance > maxDistance) return;
    let bound = itemUtils.getItemByIdentifier(firstToken.actor, 'shieldGuardianBound');
    if (!bound) return;
    let reduction = Math.ceil(ditem.totalDamage / 2);
    workflowUtils.modifyDamageAppliedFlat(ditem, -reduction);
    let activity = bound.system.activities.contents[0];
    await activityUtils.setDamage(activity, reduction);
    await workflowUtils.syntheticActivityRoll(activity, [firstToken]);
}
export let mastersAmulet = {
    name: 'Master\'s Amulet',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 25
            }
        ],
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
            value: 'distance',
            label: 'CHRISPREMADES.Config.Distance',
            type: 'text',
            default: 60,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};