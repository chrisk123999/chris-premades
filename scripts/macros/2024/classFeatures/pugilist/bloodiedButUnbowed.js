import {activityUtils, actorUtils, dialogUtils, itemUtils, socketUtils, workflowUtils} from '../../../../utils.js';

async function damaged({trigger: {entity: item, token: self}, ditem}) {
    if (!ditem.isHit || !ditem.totalDamage) return;
    if (!item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(self.actor)) return;
    let bloodied = ditem.newHP <= Math.floor(0.5 * self.actor.system.attributes.hp.effectiveMax);
    let bloodiedOnly = itemUtils.getConfig(item, 'triggerBloodiedOnly');
    if (bloodiedOnly && !bloodied) return;
    let player = socketUtils.firstOwner(self, true);
    if (!await dialogUtils.confirmUseItem(item, {userId: player})) return;
    let recover = activityUtils.getActivityByIdentifier(item, 'recover', {strict: true});
    if (recover) await workflowUtils.completeActivityUse(recover, {midiOptions: {asUser: player}});
    if (!bloodied) return;
    let tempHP = activityUtils.getActivityByIdentifier(item, 'bloodiedTempHP', {strict: true});
    if (tempHP) workflowUtils.completeActivityUse(tempHP, {midiOptions: {asUser: player}});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['recover'], 'moxie');
}
export let bloodiedButUnbowed = {
    name: 'Bloodied But Unbowed',
    version: '1.4.25',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damaged,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],
    config: [
        {
            value: 'triggerBloodiedOnly',
            label: 'CHRISPREMADES.Macros.BloodiedButUnbowed.Trigger',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};
