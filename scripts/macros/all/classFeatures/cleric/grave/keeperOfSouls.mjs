import {activityUtils, actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function creatureDeath({document: activity, ditem, macroClass: {identifier, source}, targetToken}) {
    if (!ditem.isHit || ditem.newHP > 0 || ditem.newHP === ditem.oldHP)  return;
    const config = automationUtils.getConfigValues(activity.item, Object.keys(keeperOfSouls.config));
    if (!config.prompt) return;
    let promptSpell = false;
    if (!activityUtils.checkCosts(activity)) {
        if (!config.spellSlot) return Logging.addMacroWarning(source, identifier, `Keeper of Souls exited early without item uses. (activity) ${activity.uuid}`);
        if (actorUtils.hasSpellSlots(activity.actor, config.spellSlot)) promptSpell = true;
        else return Logging.addMacroWarning(source, identifier, `Keeper of Souls exited early without item uses or eligible spell slots. (activity) ${activity.uuid}`);
    }
    if (config.blocking.length && config.blocking.some(s => activity.actor.statuses.has(s)))
        return Logging(source, identifier, `Keeper of Souls exited early one or more blocking statuses. (activity) ${activity.uuid} (possible blocking) ${config.blocking.join(', ')}`);
    const self = actorUtils.getFirstToken(activity.actor);
    if (!self)
        return Logging.addMacroWarning(source, identifier, `Keeper of Souls exited early without locating the caster token. (activity) ${activity.uuid}`);
    const modern = documentUtils.getRules(activity.item) === '2024';
    if (modern && !tokenUtils.canSee(self, targetToken))
        return Logging.addMacroWarning(source, identifier, `Keeper of Souls exited early on an unseen enemy token. (caster) ${self.uuid} (enemy) ${targetToken.uuid}`);
    const range = activityUtils.getRange(activity);
    let near = tokenUtils.findNearby(self, range, {disposition: 'ally', includeToken: true});
    if (modern) near = near.filter(t => self.id === t.id || tokenUtils.canSee(self, t));
    let prompt = `${_loc('CAT.Dialog.UseOn', {document: activity.item.name, target: dialogUtils.getTokenName(targetToken)})}
        <br>${_loc('CHRISPREMADES.Generic.SelectTarget')}`;
    const document = activityUtils.hasDefaultName(activity) ? activity.item.name : activity.name;
    const inputs = [['radio', near.map((t, i) => ({
        options: {isChecked: i === 0, image: t.texture.src},
        label: t.name,
        name: t.id
    })), {radioName: 'target'}]];
    if (promptSpell) {
        prompt += '<br>' + _loc('CHRISPREMADES.Macros.All.KeeperOfSouls.SpellPrompt', {document});
        inputs.push(['radio', Object.entries(activity.actor.system.spells).filter(([_, v]) =>
            v.level >= config.spellSlot && v.value > 0 && v.max > 0
        ).map(([k, v], i) => ({
            name: k,
            label: v.label + (k === 'pact' ? ` (${v.level})` : ''),
            options: {
                isChecked: i === 0,
                image: `systems/dnd5e/icons/spell-tiers/spell${v.level}.webp`,
                tags: [{label: `(${v.value}/${v.max})`, tooltip: _loc('DND5E.Quantity'), id: 'count'}]
            }
        })), {radioName: 'spellSlot', legend: _loc('DND5E.SpellCastConsume')}]);
    }
    const choices = await dialogUtils.runDialog(queryUtils.firstOwner(activity.actor, true), document, prompt, inputs, 'okCancel');
    if (!choices?.buttons) return;
    const target = near.find(t => t.id === choices.target);
    if (!target) return Logging.addMacroWarning(source, identifier, `Keeper of Souls exited early without locating the chosen target token. (activity) ${activity.uuid} (choice) ${choices.target} (targets) ${near.map(t => t.id).join(', ')}`);
    const options = modern ? {} : {config: {scaling: targetToken.actor.system.attributes.hd.value - 1}};
    if (promptSpell) {
        await actorUtils.spendSpellSlots(activity.actor, choices.spellSlot);
        options.consumeResources = false;
    }
    await workflowUtils.syntheticActivityRoll(activity, [target], options);
}
export const keeperOfSouls = {
    name: 'Keeper of Souls',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'sceneDamageComplete',
            macro: creatureDeath,
            priority: 600,
            canOverlap: true
        }
    ],
    config: {
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        },
        blocking: {
            default: ['incapacitated'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            get options() { return constants.statusOptions; }
        },
        spellSlot: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.DivineSmite.Slot',
            hint: 'CHRISPREMADES.Macros.All.KeeperOfSouls.Spell',
            get options() { return constants.spellSlotOptions; }
        }
    }
};
