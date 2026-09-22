import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
export const subtleComponents = ['vocal', 'somatic'];
function getAvailablePoints(actor) {
    return actorUtils.getItemByIdentifier(actor, 'font-of-magic')?.system.uses.value ?? 0;
}
function getMetamagicActivity(item) {
    return itemUtils.getActivityByIdentifier(item, 'metamagic');
}
function getCost(activity) {
    return Number(activity?.consumption.targets[0]?.value ?? 0);
}
function getCharismaMax(actor) {
    return Math.max(1, actor.system.abilities.cha.mod);
}
function getValidSpells(actor, predicate) {
    return actorUtils.getCastableSpells(actor).filter(predicate);
}
function getTargets(workflow) {
    return Array.from(workflow.targets, token => token.document ?? token);
}
async function selectSpell(item, spells) {
    if (!spells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.Metamagic.NoValid', {type: 'info'});
        return;
    }
    const cost = getCost(getMetamagicActivity(item));
    return await dialogUtils.selectDocumentDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.Metamagic.Which', {cost, plural: cost === 1 ? '' : 's'}), spells, {
        sort: 'level',
        showSpellLevel: true,
        addNoneDocument: true
    });
}
async function castSpell(spell, workflow) {
    return await workflowUtils.syntheticItemRoll(spell, getTargets(workflow), {options: {configureDialog: true}, dialog: {configure: true}});
}
function modifiedSpellData(spell, updates) {
    return genericUtils.mergeObject(spell.toObject(), updates, {inplace: false});
}
async function recast(spell, workflow, updates) {
    return await workflowUtils.syntheticItemDataRoll(modifiedSpellData(spell, updates), workflow.actor, getTargets(workflow), {options: {configureDialog: true}, dialog: {configure: true}});
}
async function useMarked(document, workflow, identifier) {
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => spell.hasSave));
    if (!selection) return;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'metamagic',
        activityUuid: workflow.activity.uuid,
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier}]}]
    });
    const [effect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    await castSpell(selection, workflow);
    if (effect) await documentUtils.deleteDocument(effect);
}
async function applySaveModifier(effect, targets, changes) {
    const effectData = documentUtils.getBaseEffectData(effect, {
        name: effect.name,
        img: constants.tempConditionIcon,
        origin: effect.uuid,
        changes,
        specialDuration: ['forceSave']
    });
    await Promise.all(targets.map(async target => await effectUtils.createEffects(target.actor, [effectData], {parentEntity: effect})));
}
async function useCareful({document, workflow}) {
    await useMarked(document, workflow, 'careful-spell-effect');
}
async function earlyCareful({document: effect, workflow}) {
    if (!workflow.targets.size) return;
    const max = getCharismaMax(workflow.actor);
    const originItem = (await effectUtils.getOriginActivity(effect))?.item;
    let targets = getTargets(workflow);
    if (!originItem || !automationUtils.getConfigValue(originItem, 'allowEnemies')) targets = targets.filter(target => target.disposition === workflow.token.document.disposition);
    if (!targets.length) return;
    const selection = await dialogUtils.selectTargetDialog(effect.name, _loc('CHRISPREMADES.Macros.Legacy.Metamagic.CarefulWhich', {max}), targets, {type: 'multiple', maxAmount: max});
    if (!selection?.result?.length) return;
    await applySaveModifier(effect, selection.result, [{key: 'flags.midi-qol.min.ability.save.all', value: '100', type: 'override', priority: 120}]);
}
async function useDistant({document, workflow}) {
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => ['touch', 'ft'].includes(spell.system.range.units) && spell.system.target.affects.type && spell.system.target.affects.type !== 'self'));
    if (!selection) return;
    const updates = selection.system.range.units === 'touch' ? {'system.range': {units: 'ft', value: '30'}} : {'system.range.value': String(selection.system.range.value * 2)};
    await recast(selection, workflow, updates);
}
async function damageEmpowered({document, workflow}) {
    if (!workflow.hitTargets.size || workflow.item.type !== 'spell' || !workflow.damageRolls?.length) return;
    const activity = getMetamagicActivity(document);
    const cost = getCost(activity);
    if (getAvailablePoints(workflow.actor) < cost) return;
    const max = getCharismaMax(workflow.actor);
    const selection = await dialogUtils.selectDie(workflow.damageRolls, document.name, _loc('CHRISPREMADES.Macros.Legacy.Metamagic.Empowered', {cost, max}), {max});
    if (!selection?.length) return;
    await workflowUtils.completeActivityUse(activity, []);
    const rollData = document.getRollData();
    const rerolls = [];
    for (const key of selection) {
        const [rollIndex, termIndex, resultIndex] = key.split('-').map(Number);
        const term = workflow.damageRolls[rollIndex]?.terms[termIndex];
        const result = term?.results[resultIndex];
        if (!result) continue;
        rerolls.push({result, faces: term.faces, original: result.result});
    }
    if (!rerolls.length) return;
    const groups = rerolls.reduce((accumulator, reroll) => {
        const group = accumulator.get(reroll.faces) ?? [];
        group.push(reroll);
        return accumulator.set(reroll.faces, group);
    }, new Map());
    const rolls = Array.from(groups, ([faces, group]) => new Roll(group.length + 'd' + faces, rollData));
    const resolved = await rollUtils.resolveManualRolls(rolls, workflow.actor, document.name, {rollClass: Roll});
    if (resolved === rolls) await Promise.all(rolls.map(async roll => await roll.evaluate()));
    Array.from(groups.values()).forEach((group, groupIndex) => {
        const results = resolved[groupIndex].terms[0].results;
        group.forEach((reroll, index) => reroll.result.result = results[index].result);
    });
    const messageData = {
        speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}),
        flavor: _loc('CHRISPREMADES.Macros.Legacy.Metamagic.Rerolled', {dice: rerolls.map(reroll => 'd' + reroll.faces + ' (' + reroll.original + ')').join(', ')}),
        rolls: resolved
    };
    ChatMessage.implementation.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
    await ChatMessage.implementation.create(messageData);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function useExtended({document, workflow}) {
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => (spell.system.duration.getEffectData().seconds ?? 0) >= 60));
    if (!selection) return;
    const oldSeconds = selection.system.duration.getEffectData().seconds;
    const newSeconds = Math.min(86400, oldSeconds * 2);
    const castWorkflow = await recast(selection, workflow, {'system.duration': {value: String(newSeconds / 60), units: 'minute'}});
    const actors = new Set([workflow.actor, ...Array.from(castWorkflow?.targets ?? [], token => (token.document ?? token).actor)].filter(actor => actor));
    await Promise.all(Array.from(actors, async actor => {
        const effects = actor.effects.filter(effect => effect.origin?.startsWith(selection.uuid) && effect.duration.units === 'seconds' && effect.duration.value === oldSeconds);
        await Promise.all(effects.map(async effect => await documentUtils.update(effect, {'duration.value': newSeconds})));
    }));
}
async function useHeightened({document, workflow}) {
    await useMarked(document, workflow, 'heightened-spell-effect');
}
async function earlyHeightened({document: effect, workflow}) {
    if (!workflow.targets.size) return;
    const targets = getTargets(workflow).filter(target => target.disposition !== workflow.token.document.disposition);
    if (!targets.length) return;
    const selection = await dialogUtils.selectTargetDialog(effect.name, _loc('CHRISPREMADES.Macros.Legacy.Metamagic.HeightenedWhich'), targets);
    if (!selection?.result) return;
    await applySaveModifier(effect, [selection.result], [{key: 'flags.midi-qol.disadvantage.save.all', value: '1', type: 'override', priority: 20}]);
}
async function useQuickened({document, workflow}) {
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => spell.system.activation.type === 'action'));
    if (!selection) return;
    await recast(selection, workflow, {'system.activation.type': 'bonus'});
}
async function attackSeeking({document, workflow}) {
    if (!workflow.attackRoll || !workflow.targets.size || workflow.item.type !== 'spell') return;
    if (Array.from(workflow.targets).every(target => (target.actor?.system.attributes.ac.value ?? Infinity) <= workflow.attackRoll.total)) return;
    const activity = getMetamagicActivity(document);
    if (getAvailablePoints(workflow.actor) < getCost(activity)) return;
    const selection = await dialogUtils.confirmUseForRollTotal(document, workflow.item.name, workflow.attackRoll.total);
    if (!selection) return;
    await workflowUtils.completeActivityUse(activity, []);
    const [newRoll] = await workflow.activity.rollAttack({}, {}, {create: false});
    if (newRoll) await workflow.setAttackRoll(newRoll);
}
async function useSubtle({document, workflow}) {
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => subtleComponents.some(component => spell.system.properties.has(component))));
    if (!selection) return;
    await recast(selection, workflow, {'system.properties': Array.from(selection.system.properties).filter(property => !subtleComponents.includes(property))});
}
function getTransmutedUpdates(spell, oldType, newType) {
    const activityUpdates = {};
    for (const activity of spell.system.activities.getByTypes('attack', 'damage', 'save')) {
        if (!activity.damage.parts.some(part => part.types.has(oldType) || new Roll(part.formula).terms.some(term => term.flavor === oldType))) continue;
        activityUpdates[activity.id] = {
            damage: {
                parts: activity.damage.parts.map(part => {
                    const update = {};
                    if (part.custom.enabled) update.custom = {enabled: true, formula: part.custom.formula.replaceAll(oldType, newType)};
                    if (part.types.has(oldType)) update.types = [newType];
                    return {...part, ...update};
                })
            }
        };
    }
    return {'system.activities': activityUpdates};
}
async function useTransmuted({document, workflow}) {
    const transmutableTypes = new Set(automationUtils.getConfigValue(document, 'damageTypes'));
    if (!transmutableTypes.size) return;
    const selection = await selectSpell(document, getValidSpells(workflow.actor, spell => itemUtils.getItemDamageTypes(spell).intersects(transmutableTypes)));
    if (!selection) return;
    const currentTypes = Array.from(itemUtils.getItemDamageTypes(selection).intersection(transmutableTypes));
    const oldType = currentTypes.length > 1 ? await dialogUtils.selectDamageType(currentTypes, selection.name, 'CHRISPREMADES.Macros.Legacy.Metamagic.TransmutedFirst') : currentTypes[0];
    if (!oldType) return;
    const newType = await dialogUtils.selectDamageType(Array.from(transmutableTypes).filter(type => type !== oldType), selection.name, 'CHRISPREMADES.Macros.Legacy.Metamagic.TransmutedSecond');
    if (!newType) return;
    await recast(selection, workflow, getTransmutedUpdates(selection, oldType, newType));
}
function getTargetCount(spell, level) {
    const formula = String(spell.system.target.affects.count ?? '');
    if (!formula) return;
    const rollData = genericUtils.mergeObject(spell.getRollData(), {item: {level}}, {inplace: false});
    return new Roll(formula, rollData).evaluateSync({strict: false}).total;
}
function isTwinnable(spell, level = spell.system.level) {
    return getTargetCount(spell, level) === 1 && !spell.system.target.template.count;
}
async function useTwinned({document, workflow}) {
    const available = getAvailablePoints(workflow.actor);
    const spells = getValidSpells(workflow.actor, spell => isTwinnable(spell) && Math.max(1, spell.system.level) <= available && spell.system.source.rules === '2014');
    if (!spells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.Metamagic.NoValid', {type: 'info'});
        return;
    }
    const selection = await dialogUtils.selectDocumentDialog(document.item.name, _loc('CHRISPREMADES.Macros.Legacy.Metamagic.TwinnedWhich'), spells, {
        sort: 'level',
        showSpellLevel: true,
        addNoneDocument: true
    });
    if (!selection) return;
    const macros = [...(selection.flags.cat?.macros?.roll ?? []), {source: 'chris-premades', rules: '2014', identifier: 'twinned-spell-cast'}];
    if (!selection.system.activities.some(activity => activity.hasAttack)) {
        await recast(selection, workflow, {'system.target.affects.count': '2', 'flags.cat.macros.roll': macros});
        return;
    }
    const targets = getTargets(workflow);
    const firstWorkflow = await workflowUtils.syntheticItemDataRoll(modifiedSpellData(selection, {'flags.cat.macros.roll': macros}), workflow.actor, targets.slice(0, 1), {options: {configureDialog: true}, dialog: {configure: true}});
    if (!targets[1] || firstWorkflow?.aborted) return;
    await workflowUtils.syntheticItemRoll(selection, [targets[1]], {
        config: {concentration: {begin: false}},
        atLevel: workflowUtils.getCastLevel(firstWorkflow),
        consumeUsage: false,
        consumeResources: false,
        spellSlot: false
    });
}
async function abortTwinned(workflow, message) {
    genericUtils.notify(message, {type: 'info'});
    const castLevel = workflowUtils.getCastLevel(workflow);
    if (castLevel) await actorUtils.recoverSpellSlots(workflow.actor, castLevel);
    const concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentration) await documentUtils.deleteDocument(concentration);
    return true;
}
async function earlyTwinned({workflow}) {
    const metamagic = actorUtils.getItemByIdentifier(workflow.actor, 'twinned-spell');
    if (!metamagic) return;
    const castLevel = workflowUtils.getCastLevel(workflow) ?? workflow.item.system.level;
    if (!isTwinnable(workflow.item, castLevel)) {
        return await abortTwinned(workflow, 'CHRISPREMADES.Macros.Legacy.Metamagic.TwinnedUpcastTargets');
    }
    const cost = Math.max(1, castLevel);
    if (getAvailablePoints(workflow.actor) < cost) return await abortTwinned(workflow, 'CHRISPREMADES.Macros.Legacy.Metamagic.TwinnedUpcast');
    await workflowUtils.spendScaledCost(metamagic, 'twinned-spell-cost', cost);
}
export const carefulSpell = {
    name: 'Metamagic: Careful Spell',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: useCareful, priority: 50}
    ],
    config: {
        allowEnemies: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.AllowEnemies',
            category: 'mechanics'
        }
    }
};
export const carefulSpellEffect = {
    name: 'Metamagic: Careful Spell: Effect',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'actorPreambleComplete', macro: earlyCareful, priority: 50}
    ]
};
export const distantSpell = {
    name: 'Metamagic: Distant Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useDistant, priority: 50}
    ]
};
export const empoweredSpell = {
    name: 'Metamagic: Empowered Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'actorDamageRollComplete', macro: damageEmpowered, priority: 50}
    ]
};
export const extendedSpell = {
    name: 'Metamagic: Extended Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useExtended, priority: 50}
    ]
};
export const heightenedSpell = {
    name: 'Metamagic: Heightened Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useHeightened, priority: 50}
    ]
};
export const heightenedSpellEffect = {
    name: 'Metamagic: Heightened Spell: Effect',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'actorPreambleComplete', macro: earlyHeightened, priority: 50}
    ]
};
export const quickenedSpell = {
    name: 'Metamagic: Quickened Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useQuickened, priority: 50}
    ]
};
export const seekingSpell = {
    name: 'Metamagic: Seeking Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'actorAttackRoll', macro: attackSeeking, priority: 800}
    ]
};
export const subtleSpell = {
    name: 'Metamagic: Subtle Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useSubtle, priority: 50}
    ]
};
export const transmutedSpell = {
    name: 'Metamagic: Transmuted Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemRollFinished', macro: useTransmuted, priority: 50}
    ],
    config: {
        damageTypes: {
            default: ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
export const twinnedSpell = {
    name: 'Metamagic: Twinned Spell',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'activityRollFinished', macro: useTwinned, priority: 50}
    ]
};
export const twinnedSpellCast = {
    name: 'Metamagic: Twinned Spell: Cast',
    version: carefulSpell.version,
    rules: carefulSpell.rules,
    roll: [
        {pass: 'itemPreItemRoll', macro: earlyTwinned, priority: 50}
    ]
};
