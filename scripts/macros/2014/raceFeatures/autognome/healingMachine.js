import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../utils.js';
let heals = [
    'cure-wounds', 
    'healing-word', 
    'massCureWounds', 
    'mass-cure-wounds', 
    'mass-healing-word', 
    'spare-the-dying'
];
async function targeted({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    let sysID = workflow.item.system.identifier;
    let cprID = genericUtils.getIdentifier(workflow.item);
    let isMending = sysID === 'mending';
    let isHeal = heals.some(h => sysID === h || cprID === h);
    if (isMending) {
        let heal = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
        if (!heal) return;
        await workflowUtils.syntheticActivityRoll(heal);
    }
    if (isHeal) await healTheConstruct(item);
}
async function doMending({activity, actor}) {
    let heal = activityUtils.getActivityByIdentifier(activity.item, 'heal', {strict: true});
    if (!heal) return true;
    let hd = actor.system.attributes.hd;
    if (!hd.value){
        genericUtils.notify(`[${activity.item.name}]: ${genericUtils.format('DND5E.HitDiceNPCWarn', {name: actor.name})}`, 'warn');
        return true;
    }
    let many = hd.sizes?.size > 1;
    let denom;
    if (many) {
        let userId = socketUtils.firstOwner(actor, true);
        denom = await dialogUtils.selectHitDie(actor, activity.item.name, 'CHRISPREMADES.Macros.Healer.SelectHitDie', {userId});
        if(!denom || !denom[0].amount) return true;
        denom = denom[0].document.system.hd.denomination;
    } else
        denom = 'd' + (hd.largestFace || hd.denomination);
    heal = activityUtils.withChangedDamage(heal, `max(1, 1${denom} + @abilities.con.mod)`);
    heal.consumption.targets = [actor.type === 'npc' ? {
        target: 'attributes.hd.value',
        type: 'attribute',
        value: 1
    } : {
        target: denom,
        type: 'hitDice',
        value: 1
    }];
    await workflowUtils.syntheticActivityDataRoll(heal, activity.item, actor, [], {consumeUsage: true, consumeResources: true});
    return true;
}
async function healTheConstruct(item) {
    await effectUtils.createEffect(item.parent, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.details.type.value',
                value: 'humanoid',
                mode: 5,
                priority: 20
            },
            {
                key: 'system.details.race.name',
                value: 'Human',
                mode: 5,
                priority: 20
            }
        ]
    }, {identifier: 'conditionResistance'});
}
export let healingMachine = {
    name: 'Healing Machine',
    version: '1.5.28',
    midi: {
        actor: [
            {
                pass: 'targetPreItemRoll',
                macro: targeted,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'preTargeting',
                macro: doMending,
                priority: 50,
                activities: ['use']
            }
        ]
    }
};
