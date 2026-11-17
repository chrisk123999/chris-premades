import {actorUtils, applications, automationUtils, dialogUtils, documentUtils, effectUtils, Logging, tokenUtils, uiUtils, workflowUtils} from '../../../../../proxy.mjs';
async function healedAlly({document: activity, workflow}) {
    const level = workflow.castData?.castLevel;
    if (workflow.item.type !== 'spell' || !level) return;
    if (!automationUtils.getConfigValue(activity.item, 'prompt')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls ?? []).has('healing')) return;
    const allies = workflow.targets.documents.filter(t => !tokenUtils.isEnemy(t, workflow.tokenDocument));
    if (!allies.length || !await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity, allies, {config: {scaling: level - 1}});
}
async function breakSpell({macroClass: {identifier, source}, workflow}) {
    const effects = {}, inputs = [];
    const level = workflow.utilityRoll.total;
    for (const ally of workflow.targets.documents) {
        if (!ally.actor) continue;
        const spells = [];
        for (const effect of actorUtils.getEffects(ally.actor, {includeItemEffects: true})) {
            const cast = effectUtils.getCastData(effect);
            if (!cast || cast.castLevel < 0 || cast.castLevel > level) continue;
            const origin = await effectUtils.getOriginActivity(effect);
            if (!origin) continue;
            const caster = actorUtils.getFirstToken(origin.actor);
            if (!caster || !tokenUtils.isEnemy(ally, caster)) continue;
            effect.cpr = {level: cast.castLevel};
            spells.push(effect);
        }
        if (!spells.length) continue;
        effects[ally.id] = spells;
        inputs.push({
            name: ally.id,
            label: ally.name,
            options: {
                image: ally.texture.src,
                isChecked: !inputs.length,
                tags: [{label: `${_loc('CAT.MEDKIT.DocumentMap.Count')} ${dnd5e.utils.formatNumber(spells.length)}`, id: 'count'}],
                subinputs: [['radio', await Promise.all(spells.map(async (s, i) => ({
                    name: s.id, label: s.name, options: {
                        tags: [
                            {label: s.duration.label, id: 'duration', tooltip: _loc('DND5E.Duration')},
                            {label: CONFIG.DND5E.spellLevels[s.cpr.level] ?? '', id: 'level'}
                        ],
                        tooltip: await uiUtils.enrichHTML(s.description),
                        isChecked: !i,
                        image: s.img
                    }
                }))), {radioName: ally.id + '.effect'}]]
            }
        });
    }
    if (!inputs.length) {
        Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Legacy.SpellBreaker.Warn', {notify: true});
        return workflow.aborted = true;
    }
    const choice = await applications.DialogApp.dialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Legacy.SpellBreaker.Prompt',
        [['radio', inputs, {radioName: 'ally'}]],
        'okCancel'
    );
    if (!choice?.buttons) return;
    const effect = effects[choice.ally]?.find(e => e.id === choice[choice.ally]?.effect);
    if (effect) await documentUtils.deleteDocument(effect);
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
