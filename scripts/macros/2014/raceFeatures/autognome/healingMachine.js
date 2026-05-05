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
    if (isMending) await doMending(item);
    if (isHeal) await healTheConstruct(item);
}
async function doMending(item) {
    let heal = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
    if (!heal) return;
    let hd = item.parent.system.attributes.hd;
    if (!hd.value) return;
    let many = hd.sizes?.size > 1;
    let denom;
    if (many) {
        let userId = socketUtils.firstOwner(item.parent, true);
        denom = await dialogUtils.selectHitDie(item.parent, item.name, 'CHRISPREMADES.Macros.Healer.SelectHitDie', {userId});
        if(!denom?.[0].amount) return;
        denom = denom[0].document.system.hd.denomination;
    } else
        denom = 'd' + (hd.largestFace || hd.denomination);
    heal = activityUtils.withChangedDamage(heal, `max(1${denom} + @abilities.con.mod, 1)`);
    heal.consumption.targets = [{
        target: denom,
        type: 'hitDice',
        value: 1
    }];
    await workflowUtils.syntheticActivityDataRoll(heal, item, item.parent, [], {consumeUsage: true, consumeResources: true});
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
    version: '1.5.16',
    midi: {
        actor: [
            {
                pass: 'targetPreItemRoll',
                macro: targeted,
                priority: 50
            }
        ]
    }
};
