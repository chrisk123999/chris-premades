import cprConstants from '../../../constants.mjs';
import {compendiumUtils, dialogUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function leftoverDamage(details, hp) {
    let pool = hp;
    const total = {};
    for (const entry of [...details].sort((a, b) => b.active.multiplier - a.active.multiplier)) {
        if (entry.active.multiplier === 0) continue;
        total[entry.type] ??= 0;
        if (entry.value <= pool) {
            pool -= entry.value;
            continue;
        }
        if (pool <= 0) {
            total[entry.type] += entry.damage;
            continue;
        }
        total[entry.type] += Math.floor(entry.damage - (pool / entry.active.multiplier));
        pool = 0;
    }
    return total;
}
async function rollFinished(workflow) {
    const mode = game.settings.get('chris-premades', 'dmgCleave');
    if (mode === 'off' || workflowUtils.getWorkflowProperty(workflow, 'dmgCleave') || !workflow.token || workflow.hitTargets.size !== 1 || !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const [entry] = workflow.damageList ?? [];
    const target = workflow.hitTargets.first();
    if (!entry || entry.newHP !== 0 || !(entry.oldHP > 0) || !target.actor) return;
    if (mode === 'full' && entry.oldHP !== target.actor.system.attributes.hp.max) return;
    const damage = leftoverDamage(entry.damageDetail ?? [], entry.oldHP);
    if (!Object.values(damage).some(value => value > 0)) return;
    const range = workflow.rangeDetails?.range ?? 5;
    const nearby = tokenUtils.findNearby(target.document, 5, {disposition: 'ally'}).filter(token => token.actor && tokenUtils.getDistance(workflow.token.document, token) <= range);
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(_loc('CHRISPREMADES.Settings.DmgCleave.Name'), _loc('CHRISPREMADES.Macros.Legacy.DmgCleave.Use'), nearby, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
    const next = selection?.result;
    if (!next) return;
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.misc, 'dmg-cleave', {object: true});
    if (workflow.item.system.properties.has('mgc')) itemData.system.properties.push('mgc');
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'dmgCleave', {attack: workflow.attackRoll.toJSON(), damage});
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [next], {options});
}
async function attack({workflow}) {
    const data = workflowUtils.getWorkflowProperty(workflow, 'dmgCleave');
    if (data) await workflow.setAttackRoll(CONFIG.Dice.D20Roll.fromData(data.attack));
}
async function damage({workflow}) {
    const data = workflowUtils.getWorkflowProperty(workflow, 'dmgCleave');
    if (!data) return;
    const rolls = await Promise.all(Object.entries(data.damage).filter(([, value]) => value > 0).map(([type, value]) => rollUtils.damageRoll(String(value), workflow.activity, {type})));
    await workflow.setDamageRolls(rolls);
}
export const dmgCleave = {
    name: 'DMG Cleave',
    version: '2.1.6',
    rules: '2014',
    roll: [
        {
            pass: 'itemAttackRoll',
            macro: attack,
            priority: 50
        },
        {
            pass: 'itemDamageRoll',
            macro: damage,
            priority: 50
        }
    ]
};
export const dmgCleaveHooks = {rollFinished};
