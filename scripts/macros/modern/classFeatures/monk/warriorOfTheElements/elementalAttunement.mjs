import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
import {applyDamageType, rememberCombat} from '../../../../generic/selectDamageType.mjs';
const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'thunder'];
async function attune({workflow}) {
    if (workflow.activity.identifier !== 'use') return;
    const effect = actorUtils.getEffects(workflow.actor).find(other => documentUtils.getIdentifier(other) === 'elementalAttunementEffect');
    if (!effect) return;
    const strikes = actorUtils.getItemByIdentifier(workflow.actor, 'unarmed-strike', {multiple: true}) ?? [];
    for (const strike of strikes) {
        const reach = (strike.system.range.reach ?? 5) + 10;
        const enchantData = documentUtils.getBaseEffectData(workflow.activity, {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: effect.uuid,
            changes: [{key: 'system.range.reach', type: 'override', value: String(reach), priority: 20}, {key: 'flags.chris-premades.elementalAttunement', type: 'override', value: 'true', priority: 20}]
        });
        const enchantment = await itemUtils.enchantItem(strike, enchantData);
        if (enchantment) await documentUtils.makeDependent(effect, [enchantment]);
    }
}
async function strike({document: effect, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'unarmed-strike' || !workflow.hitTargets.count) return;
    if (workflowUtils.getWorkflowProperty(workflow, 'empoweredStrikes')) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    const type = await dialogUtils.selectDamageType(damageTypes, item?.name ?? effect.name, 'CHRISPREMADES.Generic.SelectDamageType', {addNo: true, userId: queryUtils.firstOwner(workflow.actor, true), ...(item ? rememberCombat(workflow.token?.document, item) : {})});
    if (!type) return;
    await applyDamageType(workflow, type);
    workflowUtils.setWorkflowProperty(workflow, 'elementalStrikes', type);
}
async function shove({document: effect, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'elementalStrikes') || workflow.hitTargets.count !== 1) return;
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return;
    const buttons = [['Push', 'push'], ['Pull', 'pull'], ['None', false]].map(([label, value]) => [_loc('CHRISPREMADES.Macros.Modern.ElementalAttunement.' + label), value]);
    const choice = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Modern.ElementalAttunement.Move', buttons, {userId: queryUtils.firstOwner(workflow.actor, true)});
    const activity = choice ? itemUtils.getActivityByIdentifier(item, choice) : undefined;
    if (activity) await workflowUtils.completeActivityUse(activity, workflow.hitTargets.documents);
}
export const elementalAttunement = {
    name: 'Elemental Attunement',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: attune,
            priority: 50
        }
    ]
};
export const elementalAttunementActive = {
    name: 'Elemental Attunement: Active',
    version: elementalAttunement.version,
    rules: '2024',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: strike,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: shove,
            priority: 50
        }
    ]
};
