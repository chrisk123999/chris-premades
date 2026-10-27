import {actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../proxy.mjs';
const dayLength = 86400;
async function selectSpell(maxLevel) {
    const packIds = compendiumUtils.getEnabledCompendiumIds('spellCompendiums');
    if (!packIds.length) return Logging.addMacroWarning('CPR', 'wish', 'CAT.Error.NoSpellCompendiums', {notify: 'warn'});
    const lockedFilters = maxLevel === undefined ? undefined : {additional: {level: {max: maxLevel}}};
    const [spell] = await compendiumUtils.selectFromCompendiumBrowser('spells', {packIds, lockedFilters, maxAmount: 1}) ?? [];
    return spell;
}
async function early({document, activity}) {
    if (activity.identifier === 'wish-stress' || !automationUtils.getConfigValue(document, 'blocked')) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.Wish.Blocked', {type: 'warn'});
    return true;
}
async function duplicateSpell({document, workflow}) {
    const spell = await selectSpell(automationUtils.getConfigValue(document, 'maxLevel'));
    if (!spell) return;
    const spellData = spell.toObject();
    spellData.system.properties = spellData.system.properties.filter(property => !['vocal', 'somatic', 'material'].includes(property));
    spellData.system.materials = {value: '', consumed: false, cost: 0, supply: 0};
    spellData.system.method = 'innate';
    spellData.system.activation.type = 'special';
    await workflowUtils.completeItemUse(itemUtils.syntheticItem(spellData, workflow.actor), [], {consumeResources: false, spellSlot: false});
}
function hasReduction(effect) {
    const abilities = Object.keys(CONFIG.DND5E.abilities).map(ability => 'system.abilities.' + ability + '.value');
    return (effect.system?.changes ?? []).some(change => (abilities.includes(change.key) || change.key === 'system.attributes.hp.tempmax') && Number(change.value) < 0);
}
async function instantHealth({document, workflow}) {
    const conditions = automationUtils.getConfigValue(document, 'instantHealthConditions');
    const tokens = workflow.targets.size ? Array.from(workflow.targets) : [workflow.token];
    await Promise.all(tokens.map(async token => {
        const actor = token.actor;
        const effects = new Set(actorUtils.getStatusSources(actor, conditions.filter(condition => condition !== 'exhaustion')) ?? []);
        actor.effects.filter(hasReduction).forEach(effect => effects.add(effect));
        if (effects.size) await documentUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', Array.from(effects, effect => effect.id));
        const updates = {'system.attributes.hp.value': actor.system.attributes.hp.max};
        if (conditions.includes('exhaustion')) updates['system.attributes.exhaustion'] = 0;
        await documentUtils.update(actor, updates);
    }));
}
async function resistance({document, workflow}) {
    if (!workflow.targets.size) return;
    const types = Object.keys(CONFIG.DND5E.damageTypes).filter(type => !['midi-none', 'none'].includes(type));
    const damageType = await dialogUtils.selectDamageType(types, document.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) return;
    const effectData = documentUtils.getEffectData(document, documentUtils.getEffectByIdentifier(document, 'wishResistance')?.id);
    if (!effectData) return Logging.addMacroWarning('CPR', 'wish', 'Wish: Resistance effect missing from item.', {notify: 'warn'});
    effectData.system.changes[0].value = damageType;
    await Promise.all(Array.from(workflow.targets, token => effectUtils.createEffects(token.actor, [genericUtils.duplicate(effectData)])));
}
async function spellImmunity({document, workflow}) {
    if (!workflow.targets.size) return;
    const spell = await selectSpell();
    if (!spell) return;
    const effectData = documentUtils.getEffectData(workflow.activity, documentUtils.getEffectByIdentifier(document, 'wishImmunity')?.id);
    if (!effectData) return Logging.addMacroWarning('CPR', 'wish', 'Wish: Spell Immunity effect missing from item.', {notify: 'warn'});
    effectData.name += ' (' + spell.name + ')';
    genericUtils.setProperty(effectData, 'flags.chris-premades.wish', {spellName: spell.name, spellIdentifier: spell.system.identifier});
    await Promise.all(Array.from(workflow.targets, token => effectUtils.createEffects(token.actor, [genericUtils.duplicate(effectData)])));
}
async function stress({document, workflow}) {
    if (['wish-duplicate-spell', 'wish-stress'].includes(workflow.activity.identifier)) return;
    const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'wishStress');
    if (existing) await documentUtils.deleteDocument(existing);
    const {stressDurationFormula, chanceFormula, chanceNumber} = automationUtils.getConfigValues(document, ['stressDurationFormula', 'chanceFormula', 'chanceNumber']);
    const {roll: days} = await rollUtils.rollDice(stressDurationFormula, {document, message: true, flavor: document.name});
    const effectData = documentUtils.getEffectData(document, documentUtils.getEffectByIdentifier(document, 'wishStress')?.id, {duration: {value: days.total * dayLength, units: 'seconds'}});
    if (!effectData) return Logging.addMacroWarning('CPR', 'wish', 'Wish: Stress effect missing from item.', {notify: 'warn'});
    genericUtils.setProperty(effectData, 'flags.chris-premades.wish', {itemUuid: document.uuid, castDamage: true});
    await effectUtils.createEffects(workflow.actor, [effectData]);
    if (!chanceNumber) return;
    const {roll: chance} = await rollUtils.rollDice(chanceFormula, {document, message: true, flavor: document.name});
    if (chance.total <= chanceNumber) await automationUtils.setConfigValue(workflow.actor.items.get(document.id) ?? document, 'blocked', true);
}
async function stressDamage({document: effect, workflow}) {
    if (workflow.item?.type !== 'spell' || !effect.flags['chris-premades']?.wish?.castDamage) return;
    const level = workflowUtils.getCastLevel(workflow);
    if (!level || !workflow.token) return;
    const item = fromUuidSync(effect.flags['chris-premades'].wish.itemUuid, {strict: false});
    if (!item || workflow.item.uuid === item.uuid) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'wish-stress');
    if (!activity) return;
    const activityData = activity.toObject();
    activityData.damage.parts[0].number = level;
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [workflow.token.document]);
}
async function rest({document: effect}) {
    if (effect.flags['chris-premades']?.wish?.castDamage) await documentUtils.setFlag(effect, 'chris-premades', 'wish.castDamage', false);
    if (!await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.Modern.Wish.Rest')) return;
    if ((effect.duration.secondsRemaining ?? 0) <= 2 * dayLength) await documentUtils.deleteDocument(effect);
    else await documentUtils.update(effect, {'duration.value': effect.duration.value - 2 * dayLength});
}
async function targeted({document: effect, workflow, sourceToken}) {
    if (workflow.item?.type !== 'spell') return;
    const {spellName, spellIdentifier} = effect.flags['chris-premades']?.wish ?? {};
    if (!spellName || (workflow.item.system.identifier !== spellIdentifier && workflow.item.name !== spellName)) return;
    const target = Array.from(workflow.targets).find(token => token.document === sourceToken);
    if (target) await workflowUtils.removeTargets(workflow, [target]);
}
const activities = {
    'wish-duplicate-spell': duplicateSpell,
    'wish-instant-health': instantHealth,
    'wish-resistance': resistance,
    'wish-spell-immunity': spellImmunity
};
async function use(data) {
    await activities[data.workflow.activity.identifier]?.(data);
}
export const wish = {
    name: 'Wish',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: stress,
            priority: 51
        }
    ],
    config: {
        stressDurationFormula: {
            default: '2d4',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.Wish.StressDuration',
            category: 'homebrew',
            homebrew: true
        },
        chanceFormula: {
            default: '1d100',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.Wish.ChanceFormula',
            category: 'homebrew',
            homebrew: true
        },
        chanceNumber: {
            default: 33,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.Wish.ChanceNumber',
            hint: 'CHRISPREMADES.Macros.Modern.Wish.ChanceNumberHint',
            category: 'homebrew',
            homebrew: true
        },
        blocked: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.Wish.BlockedLabel',
            hint: 'CHRISPREMADES.Macros.Modern.Wish.BlockedHint',
            category: 'mechanics'
        },
        instantHealthConditions: {
            default: ['exhaustion', 'charmed', 'petrified'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Modern.Wish.InstantHealthConditions',
            category: 'homebrew',
            homebrew: true,
            get options() { return constants.statusOptions; }
        },
        maxLevel: {
            default: 8,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.Wish.MaxLevel',
            category: 'homebrew',
            homebrew: true
        }
    }
};
export const wishStress = {
    name: 'Wish: Stress',
    version: wish.version,
    rules: wish.rules,
    roll: [
        {
            pass: 'actorRollFinished',
            macro: stressDamage,
            priority: 450
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: rest,
            priority: 50
        }
    ]
};
export const wishImmunity = {
    name: 'Wish: Spell Immunity',
    version: wish.version,
    rules: wish.rules,
    roll: [
        {
            pass: 'targetPreambleComplete',
            macro: targeted,
            priority: 25
        }
    ]
};
