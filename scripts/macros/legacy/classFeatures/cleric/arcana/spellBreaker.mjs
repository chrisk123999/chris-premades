import {actorUtils, applications, automationUtils, dialogUtils, documentUtils, effectUtils, Logging, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
async function healedAlly({document: activity, workflow}) {
    const level = workflow.castData?.castLevel;
    if (workflow.item.type !== 'spell' || !level) return;
    if (!automationUtils.getConfigValue(activity.item, 'prompt')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls ?? []).has('healing')) return;
    const allies = workflow.targets.documents.filter(t => !tokenUtils.isEnemy(t, workflow.tokenDocument));
    if (!allies.length) return;
    const effects = await collectSpellEffects(allies, level);
    if (!effects || !await dialogUtils.confirmUseItem(activity.item)) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'spellBreaker', effects);
    await workflowUtils.syntheticActivityRoll(activity, allies.filter(t => !!effects[t.id]), {config: {scaling: level - 1}, options});
}
async function collectSpellEffects(targets, levelLimit) {
    let found = false;
    const effects = {};
    for (const ally of targets) {
        if (!ally.actor) continue;
        const spells = [];
        for (const effect of actorUtils.getEffects(ally.actor, {includeItemEffects: true})) {
            const cast = effectUtils.getCastData(effect);
            if (!cast || cast.castLevel < 0 || cast.castLevel > levelLimit) continue;
            const origin = await effectUtils.getOriginActivity(effect);
            if (!origin) continue;
            const caster = actorUtils.getFirstToken(origin.actor);
            if (!caster || !tokenUtils.isEnemy(ally, caster)) continue;
            spells.push({uuid: effect.uuid, level: cast.castLevel});
        }
        if (!spells.length) continue;
        effects[ally.id] = spells;
        found = true;
    }
    if (found) return effects;
}
async function breakSpell({macroClass: {identifier, source}, workflow}) {
    const inputs = [];
    const effects = workflowUtils.getWorkflowProperty(workflow, 'spellBreaker') ??
        await collectSpellEffects(workflow.targets.documents, workflow.utilityRoll.total);
    if (!effects) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.SpellBreaker.Warn', {notify: true});
        return workflow.aborted = true;
    }
    for (const [allyID, effectData] of Object.entries(effects)) {
        const ally = workflow.targets.documents.find(t => t.id === allyID);
        if (!ally) continue;
        const spells = (await Promise.all(effectData.map(async u => ({effect: await fromUuid(u.uuid), level: u.level})))).filter(e => !!e.effect);
        if (!spells.length) continue;
        effects[allyID] = spells;
        inputs.push({
            name: ally.id,
            label: ally.name,
            options: {
                image: ally.texture.src,
                isChecked: !inputs.length,
                tags: [{label: `${_loc('CAT.MEDKIT.DocumentMap.Count')} ${dnd5e.utils.formatNumber(spells.length)}`, id: 'count'}],
                subinputs: [['radio', await Promise.all(spells.map(async ({effect, level}, i) => ({
                    name: effect.id, label: effect.name, options: {
                        tags: [
                            {label: effect.duration.label, id: 'duration', tooltip: _loc('DND5E.Duration')},
                            {label: CONFIG.DND5E.spellLevels[level] ?? '', id: 'level'}
                        ],
                        tooltip: await uiUtils.enrichHTML(effect.description),
                        isChecked: !i,
                        image: effect.img
                    }
                }))), {radioName: ally.id + '.effect', legend: _loc('DND5E.SpellEffects')}]]
            }
        });
    }
    if (!inputs.length) {
        Logging.addMacroWarning(source, identifier, `Spell Breaker exited early. Some or all spell effects could not be retrieved. (activity) ${workflow.activity.uuid}`);
        return workflow.aborted = true;
    }
    const choice = await applications.DialogApp.dialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Legacy.SpellBreaker.Prompt',
        [['radio', inputs, {radioName: 'ally'}]],
        'okCancel'
    );
    if (!choice?.buttons) return;
    const effect = effects[choice.ally]?.find(e => e.effect.id === choice[choice.ally]?.effect)?.effect;
    if (effect) await documentUtils.deleteDocument(effect);
    else Logging.addMacroWarning(source, identifier, `Spell Breaker exited early without finding the chosen spell effect. (activity) ${workflow.activity.uuid} (ally id) ${choice.ally} (effect id) ${choice[choice.ally]?.effect}`);
}
export const spellBreaker = {
    name: 'Spell Breaker',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: healedAlly,
            priority: 200
        },
        {
            pass: 'activityRollFinished',
            macro: breakSpell,
            priority: 50
        }
    ],
    config: {
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        }
    }
};
