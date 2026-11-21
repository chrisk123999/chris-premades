import {cpr} from '../../../../../module.mjs';
import {activityUtils, actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function recipients(activity, token) {
    const actor = activity.actor;
    const oceanicGift = actorUtils.getItemByIdentifier(actor, 'oceanic-gift');
    if (!oceanicGift) return [token];
    const allies = tokenUtils.findNearby(token, 60).filter(other => other !== token && other.actor && other.disposition === token.disposition);
    if (!allies.length) return [token];
    const giftActivity = oceanicGift.system.activities.contents[0];
    const buttons = [['CHRISPREMADES.Macros.Modern.WrathOfTheSea.Self', 'self'], ['CHRISPREMADES.Macros.Modern.WrathOfTheSea.Ally', 'ally']];
    if (giftActivity && activityUtils.checkCosts(giftActivity)) buttons.push(['CHRISPREMADES.Macros.Modern.WrathOfTheSea.Both', 'both']);
    const choice = await dialogUtils.buttonDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.WrathOfTheSea.Choose', buttons);
    if (!choice || choice === 'self') return [token];
    const ally = allies.length > 1 ? (await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.WrathOfTheSea.Choose', allies))?.result : allies[0];
    if (!ally) return [token];
    if (choice === 'ally') return [ally];
    await workflowUtils.completeActivityUse(giftActivity, [], {fast: true});
    return [token, ally];
}
async function manifest({workflow, macroClass: {identifier}}) {
    const activity = workflow.activity;
    const token = workflow.token?.document;
    const actor = activity.actor;
    if (!token || !actor) return;
    const ongoing = await compendiumUtils.getDocumentByIdentifier(cpr.packs.modern.features, 'wrath-of-the-sea-ongoing', {object: true});
    if (!ongoing) return Logging.addMacroWarning('CPR', identifier, 'Missing the Wrath of the Sea: Ongoing pack item.', {notify: 'warn'});
    const ongoingActivity = Object.values(ongoing.system.activities)[0];
    ongoingActivity.damage.parts[0].number = Math.max(1, actor.system.abilities.wis.mod);
    ongoingActivity.save.dc = {calculation: '', formula: String(actor.system.attributes.spell.dc)};
    const emanation = actorUtils.getItemByIdentifier(actor, 'aquatic-affinity') ? 10 : 5;
    ongoingActivity.range.value = String(emanation);
    const changes = actorUtils.getItemByIdentifier(actor, 'stormborn') ? [
        {key: 'system.attributes.movement.fly', type: 'upgrade', value: '@attributes.movement.walk', phase: 'initial', priority: 20},
        ...automationUtils.getConfigValue(activity.item, 'stormbornDamageTypes').map(type => ({key: 'system.traits.dr.value', type: 'add', value: type, phase: 'initial', priority: 20}))
    ] : [];
    for (const target of await recipients(activity, token)) {
        const existing = documentUtils.getEffectByIdentifier(target.actor, 'wrath-of-the-sea', {multiple: true});
        await Promise.all(existing.map(effect => documentUtils.deleteDocument(effect)));
        const effectData = documentUtils.getBaseEffectData(activity, {
            name: activity.item.name,
            img: activity.item.img,
            origin: activity.uuid,
            identifier: 'wrath-of-the-sea',
            duration: {value: 10, units: 'minutes'},
            specialDuration: ['incapacitated'],
            changes
        });
        const [effect] = await effectUtils.createEffects(target.actor, [effectData]) ?? [];
        if (!effect) continue;
        const [item] = await itemUtils.createItems(target.actor, [ongoing], {favorite: true, parentEntity: effect}) ?? [];
        const enemies = tokenUtils.findNearby(target, emanation).filter(other => other.actor && other !== token && other.disposition !== target.disposition);
        if (!item || !enemies.length) continue;
        const enemy = enemies.length > 1 ? (await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.WrathOfTheSea.Target', enemies))?.result : enemies[0];
        if (enemy) await workflowUtils.completeActivityUse(item.system.activities.contents[0], [enemy], {consumeResources: false, options: {workflowOptions: {notBonusAction: true}}});
    }
}
export const wrathOfTheSea = {
    name: 'Wrath of the Sea',
    version: '2.1.9',
    rules: '2024',
    config: {
        stormbornDamageTypes: {
            default: ['cold', 'lightning', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Modern.WrathOfTheSea.StormbornDamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions; }
        }
    },
    roll: [
        {
            pass: 'itemRollFinished',
            macro: manifest,
            priority: 50
        }
    ]
};
