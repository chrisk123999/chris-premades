import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
import {findItem} from '../../all/equipment/robeOfUsefulItems.mjs';
const notWondrous = ['light', 'medium', 'heavy', 'natural', 'shield', 'potion', 'scroll', 'poison', 'ammo', 'food', 'ring', 'rod', 'staff', 'wand'];
const largeDeckOnly = ['chancellor', 'dusk', 'destiny', 'coin', 'vulture', 'mystery', 'isolation', 'justice', 'student'];
function sourceEffect(item, identifier) {
    return item.effects.find(effect => documentUtils.getIdentifier(effect) === identifier);
}
function latestEffect(actor, identifier) {
    return actorUtils.getEffects(actor).filter(effect => documentUtils.getIdentifier(effect) === identifier).at(-1);
}
async function createCardEffect(workflow, identifier, {value, duration} = {}) {
    const source = sourceEffect(workflow.item, identifier);
    if (!source) return;
    const effectData = source.toObject();
    delete effectData._id;
    effectData.origin = workflow.item.uuid;
    if (duration) effectData.duration = duration;
    if (value !== undefined) effectData.system.changes[0].value = String(value);
    genericUtils.setProperty(effectData, 'flags.cat.deckOfWonder', workflow.item.uuid);
    return (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
}
async function grantSpell(workflow, identifier, {uses, parentEntity, noMaterial} = {}) {
    const spellData = await compendiumUtils.getSpell(identifier, {object: true});
    if (!spellData) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.DeckOfWonder.NoSpell', {type: 'warn', format: {identifier}});
    delete spellData._id;
    spellData.system.ability = actorUtils.getBestAbility(workflow.actor, ['int', 'wis', 'cha']);
    if (noMaterial) spellData.system.properties = spellData.system.properties.filter(property => property !== 'material');
    if (uses) {
        spellData.system.method = 'innate';
        spellData.system.uses = {spent: 0, max: String(uses), recovery: []};
        for (const activity of Object.values(spellData.system.activities ?? {})) {
            activity.consumption.targets = [{type: 'itemUses', value: '1', target: ''}];
            activity.consumption.spellSlot = false;
        }
    }
    await itemUtils.createItems(workflow.actor, [spellData], {parentEntity});
}
async function pickCompendiumItem(workflow, filter, content) {
    const entries = [];
    for (const packId of compendiumUtils.getEnabledCompendiumIds('itemCompendiums')) {
        const pack = game.packs.get(packId);
        if (!pack) continue;
        const index = await pack.getIndex({fields: ['system.rarity', 'system.type', 'system.source']});
        entries.push(...index.filter(entry => entry.system.rarity === 'uncommon' && (entry.system.source?.rules ?? '2014') === '2014' && filter(entry)));
    }
    if (!entries.length) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.DeckOfWonder.NoItems', {type: 'warn'});
    const selection = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc(content), entries, {sort: 'alphabetical', combobox: true, userId: queryUtils.gmID()});
    if (!selection) return;
    const itemData = selection.toObject();
    delete itemData._id;
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function draw({document: item, workflow}) {
    if (workflow.activity.identifier !== 'draw') return;
    const count = (workflow.item.flags.dnd5e?.scaling ?? 0) + 1;
    const ignored = ['draw', 'isolation-ended'];
    if (automationUtils.getConfigValue(item, 'mysteryDrawn')) ignored.push('mystery');
    if (automationUtils.getConfigValue(item, 'deckSize') !== '22') ignored.push(...largeDeckOnly);
    let cards = item.system.activities.filter(activity => !ignored.includes(activity.identifier));
    const token = workflow.token?.document ?? actorUtils.getFirstToken(workflow.actor);
    for (let i = 1; i <= count; i++) {
        let card;
        if (automationUtils.getConfigValue(item, 'selectCard')) {
            card = await dialogUtils.selectDocumentDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.SelectCard'), cards);
            if (!card) return;
        } else {
            const {roll} = await rollUtils.rollDice('1d' + cards.length, {document: workflow.actor, message: true, flavor: item.name});
            card = cards[roll.total - 1];
        }
        if (card.identifier === 'mischief') {
            const choice = await dialogUtils.buttonDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Mischief.Choose'), [['CHRISPREMADES.Macros.Legacy.DeckOfWonder.Mischief.Cards', 'cards'], ['CHRISPREMADES.Macros.Legacy.DeckOfWonder.Mischief.Item', 'item']]);
            if (choice === 'cards') {
                i -= 2;
                continue;
            }
        } else if (card.identifier === 'mystery') {
            i--;
            await automationUtils.setConfigValue(item, 'mysteryDrawn', true);
            cards = cards.filter(other => other.identifier !== 'mystery');
        }
        await workflowUtils.syntheticActivityRoll(card, token ? [token] : []);
        if (card.identifier === 'isolation') return;
    }
}
const cardHandlers = {
    beginning: async workflow => {
        const total = workflow.utilityRolls?.[0]?.total;
        if (!total) return;
        await createCardEffect(workflow, 'deckOfWonderBeginning', {value: total});
        const token = workflow.token?.document;
        if (token) await workflowUtils.applyDamage([token], total, 'healing');
    },
    chancellor: async workflow => {
        const effect = latestEffect(workflow.actor, 'deckOfWonderChancellor');
        if (effect) await grantSpell(workflow, 'augury', {uses: 1, parentEntity: effect, noMaterial: true});
    },
    chaos: workflow => resistance(workflow, 'deckOfWonderChaos', ['acid', 'cold', 'fire', 'lightning', 'thunder']),
    order: workflow => resistance(workflow, 'deckOfWonderOrder', ['force', 'necrotic', 'poison', 'psychic', 'radiant']),
    coin: async workflow => {
        const jewelry = workflow.utilityRolls?.[0]?.total === 1;
        const uuid = await findItem(jewelry ? 'jewelry' : 'gemstone', '2014');
        const source = uuid && await fromUuid(uuid);
        if (!source) return;
        const itemData = source.toObject();
        delete itemData._id;
        itemData.system.quantity = jewelry ? 5 : 10;
        await itemUtils.createItems(workflow.actor, [itemData]);
    },
    crown: async workflow => {
        if (actorUtils.getItemByIdentifier(workflow.actor, 'friends')) return;
        await grantSpell(workflow, 'friends');
    },
    end: async workflow => {
        const damage = Math.floor(workflow.damageList?.[0]?.hpDamage ?? 0);
        if (damage <= 0) return;
        const previous = latestEffect(workflow.actor, 'deckOfWonderEnd');
        const previousValue = Number(previous?.system.changes[0]?.value ?? 0);
        const baseMax = workflow.actor.system.attributes.hp.effectiveMax - previousValue;
        const value = Math.max(previousValue - damage, Math.min(0, 10 - baseMax));
        if (value >= previousValue) return;
        if (previous) await documentUtils.deleteDocument(previous);
        await createCardEffect(workflow, 'deckOfWonderEnd', {value});
    },
    isolation: async workflow => {
        const total = workflow.utilityRolls?.[0]?.total ?? 1;
        await createCardEffect(workflow, 'deckOfWonderIsolation', {duration: {value: total * 60, units: 'seconds'}});
    },
    knife: workflow => {
        const proficiencies = workflow.actor.system.traits.weaponProf.value;
        return pickCompendiumItem(workflow, entry => entry.type === 'weapon' && (proficiencies.has(entry.system.type?.baseItem) || proficiencies.has(CONFIG.DND5E.weaponProficienciesMap[entry.system.type?.value])), 'CHRISPREMADES.Macros.Legacy.DeckOfWonder.Knife');
    },
    lock: async workflow => {
        const effect = latestEffect(workflow.actor, 'deckOfWonderLock');
        const uses = workflow.utilityRolls?.[0]?.total;
        if (effect && uses) await grantSpell(workflow, 'knock', {uses, parentEntity: effect});
    },
    mischief: workflow => pickCompendiumItem(workflow, entry => ['equipment', 'consumable', 'container'].includes(entry.type) && !notWondrous.includes(entry.system.type?.value), 'CHRISPREMADES.Macros.Legacy.DeckOfWonder.Mischief.Select'),
    student: async workflow => {
        const abilities = workflow.actor.system.abilities;
        let ability = 'wis';
        if (abilities.wis.proficient) {
            const options = ['int', 'cha'].filter(key => !abilities[key].proficient);
            if (!options.length) return;
            ability = options.length === 1 ? options[0] : await dialogUtils.buttonDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Student'), options.map(key => [CONFIG.DND5E.abilities[key].label, key]), {userId: queryUtils.firstOwner(workflow.actor, true)}) || options[0];
        }
        await documentUtils.update(workflow.actor, {['system.abilities.' + ability + '.proficient']: 1});
    },
    vulture: async workflow => {
        const items = workflow.actor.items.filter(other => other.system.quantity !== undefined && !other.system.properties?.has('mgc'));
        if (!items.length) return;
        const selection = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Vulture.Select'), items, {sort: 'alphabetical', combobox: true, userId: queryUtils.gmID()});
        if (!selection) return;
        const lost = sourceEffect(workflow.item, 'deckOfWonderLostItem')?.toObject();
        if (!lost) return;
        delete lost._id;
        lost.origin = workflow.item.uuid;
        lost.name = _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Vulture.Lost', {name: selection.name});
        lost.system.changes = [{key: 'name', type: 'override', value: lost.name, phase: 'initial', priority: 50}];
        if (selection.system.equipped) lost.system.changes.push({key: 'system.equipped', type: 'override', value: 'false', phase: 'initial', priority: 50});
        const enchantment = await itemUtils.enchantItem(selection, lost);
        if (!enchantment) return;
        const effect = await createCardEffect(workflow, 'deckOfWonderVulture');
        if (effect) await documentUtils.setFlag(effect, 'cat', 'deckOfWonderLost', enchantment.uuid);
    }
};
async function resistance(workflow, identifier, damageTypes) {
    const type = await dialogUtils.selectDamageType(damageTypes, workflow.activity.name, 'CHRISPREMADES.Generic.SelectDamageType', {userId: queryUtils.gmID()});
    const total = workflow.utilityRolls?.[0]?.total;
    if (!type || !total) return;
    await createCardEffect(workflow, identifier, {value: type, duration: {value: total * 86400, units: 'seconds'}});
}
async function card({workflow}) {
    await cardHandlers[workflow.activity.identifier]?.(workflow);
}
async function destiny({document: effect, ditem}) {
    if (ditem.totalDamage <= 0 || ditem.oldHP <= 0) return;
    if (ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage > 0) return;
    workflowUtils.preventZeroHP(ditem);
    await documentUtils.deleteDocument(effect);
}
async function isolationEnded({document: effect}) {
    const item = await fromUuid(effect.flags.cat?.deckOfWonder);
    const activity = item && itemUtils.getActivityByIdentifier(item, 'isolation-ended');
    const token = actorUtils.getFirstToken(effectUtils.getActor(effect));
    if (activity && token) await workflowUtils.syntheticActivityRoll(activity, [token]);
}
async function justiceReaction(effect, name) {
    const actor = effectUtils.getActor(effect);
    if (!actor || actorUtils.hasUsedReaction(actor) || actor.statuses.has('incapacitated')) return;
    if (!await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Justice', {name}), {userId: queryUtils.firstOwner(actor, true)})) return;
    if (game.combat?.started) await actorUtils.setReactionUsed(actor);
    return true;
}
async function justiceAttack({document: effect, workflow}) {
    const {advantage, disadvantage} = workflow.tracker;
    if (!advantage.isActive && !disadvantage.isActive) return;
    if (workflowUtils.getWorkflowProperty(workflow, 'deckOfWonderJustice')) return;
    if (!await justiceReaction(effect, workflow.token?.document.name ?? workflow.actor.name)) return;
    workflowUtils.setWorkflowProperty(workflow, 'deckOfWonderJustice', true);
    advantage.suppress('deck-of-wonder-justice', effect.name);
    disadvantage.suppress('deck-of-wonder-justice', effect.name);
}
async function justiceTest({document: effect, roll, token}) {
    if (!roll.hasAdvantage && !roll.hasDisadvantage) return;
    if (roll.options.deckOfWonderJustice) return;
    if (!await justiceReaction(effect, token?.name ?? '')) return;
    roll.options.deckOfWonderJustice = true;
    const first = roll.terms.find(term => term.faces === 20)?.results[0]?.result;
    return first ? rollUtils.replaceD20(roll, first) : roll;
}
async function vultureEnded({document: effect}) {
    const enchantment = await fromUuid(effect.flags.cat?.deckOfWonderLost);
    if (!enchantment) return;
    const found = await dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.DeckOfWonder.Vulture.Found', {name: enchantment.parent.name}), {userId: queryUtils.gmID()});
    await documentUtils.deleteDocument(found ? enchantment : enchantment.parent);
}
export const deckOfWonder = {
    name: 'Deck of Wonder',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: draw,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: card,
            priority: 50
        }
    ],
    config: {
        deckSize: {
            default: '13',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Legacy.DeckOfWonder.Size',
            category: 'mechanics',
            options: [{value: '13', label: '13'}, {value: '22', label: '22'}]
        },
        mysteryDrawn: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.DeckOfWonder.MysteryDrawn',
            category: 'mechanics'
        },
        selectCard: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.DeckOfWonder.SelectCardConfig',
            category: 'homebrew'
        }
    }
};
export const deckOfWonderDestiny = {
    name: 'Deck of Wonder: Destiny',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: destiny,
            priority: 250
        }
    ]
};
export const deckOfWonderIsolation = {
    name: 'Deck of Wonder: Isolation',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    effect: [
        {
            pass: 'deleted',
            macro: isolationEnded,
            priority: 50
        }
    ]
};
const justiceNearby = {distance: 60, canOverlap: true};
const justiceTests = [
    {
        pass: 'nearbyBonus',
        macro: justiceTest,
        priority: 900,
        ...justiceNearby
    }
];
export const deckOfWonderJustice = {
    name: 'Deck of Wonder: Justice',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    roll: [
        {
            pass: 'nearbyAttackRollConfig',
            macro: justiceAttack,
            priority: 900,
            ...justiceNearby
        }
    ],
    check: justiceTests,
    save: justiceTests,
    skill: justiceTests,
    tool: justiceTests
};
export const deckOfWonderVulture = {
    name: 'Deck of Wonder: Vulture',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    effect: [
        {
            pass: 'deleted',
            macro: vultureEnded,
            priority: 50
        }
    ]
};
