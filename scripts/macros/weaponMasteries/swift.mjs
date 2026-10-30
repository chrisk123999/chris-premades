import {actorUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../proxy.mjs';
function getEffect(item, workflow) {
    const targets = Array.from(workflow.targets, token => token.document.uuid);
    return actorUtils.getEffects(workflow.actor).find(effect => effect.flags['chris-premades']?.swift?.weapon === item.uuid && targets.includes(effect.flags['chris-premades'].swift.target));
}
async function missed({workflow, missed}) {
    const name = itemUtils.getMasteryLabel('swift');
    const datas = missed.map(token => ({
        name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {value: null, units: 'seconds', expiry: 'sourceEnd'},
        flags: {'chris-premades': {swift: {weapon: workflow.item.uuid, target: token.document.uuid}}}
    }));
    if (datas.length) await effectUtils.createEffects(workflow.actor, datas);
}
function attack({document: item, workflow}) {
    const effect = getEffect(item, workflow);
    if (!effect) return;
    workflow.tracker.advantage.add('swift', effect.name);
    workflowUtils.setWorkflowProperty(workflow, 'swift', effect.uuid);
}
async function attackComplete({workflow}) {
    const uuid = workflowUtils.getWorkflowProperty(workflow, 'swift');
    if (uuid) await documentUtils.deleteDocument(await fromUuid(uuid));
}
async function damage({document: item, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'swift') || !workflow.hitTargets.size || !workflow.damageRolls?.length) return;
    await workflowUtils.bonusDamage(workflow, '1d4', {damageType: item.system.damage.base.types.first()});
}
export const swiftMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Swift.Label',
    macro: missed,
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50},
        {pass: 'itemAttackRollComplete', macro: attackComplete, priority: 50},
        {pass: 'itemDamageRoll', macro: damage, priority: 50}
    ]
};
