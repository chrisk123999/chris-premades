import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let scaling = await rollUtils.rollDice('@scaling', {entity: workflow.activity});
    let selectCard = itemUtils.getConfig(workflow.item, 'selectCard');
    let ignoredActivities = ['use', 'isolationEnd'];
    let mysteryDrawn = itemUtils.getConfig(workflow.item, 'mysteryDrawn');
    if (mysteryDrawn) ignoredActivities.push('mischief');
    let cards = workflow.item.system.activities.filter(activity => !ignoredActivities.includes(activityUtils.getIdentifier(activity)));
    let deckSize = itemUtils.getConfig(workflow.item, 'deckSize');
    if (deckSize === '13') {
        let skipActivities = ['chancellor', 'dusk', 'destiny', 'coin', 'vulture', 'mystery', 'isolation', 'justice', 'student'];
        cards = cards.filter(i => !skipActivities.includes(activityUtils.getIdentifier(i)));
    }
    for (let i = 1; i <= scaling.total; i++) {
        let selection;
        if (selectCard) {
            selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.DeckOfWonder.SelectACard', cards);
            if (!selection) return;
        } else {
            let roll = await rollUtils.rollDice('1d' + cards.length, {chatMessage: true});
            selection = cards[roll.roll.total - 1];
        }
        let selectionIdentifier = activityUtils.getIdentifier(selection);
        switch (selectionIdentifier) {
            case 'mischief': {
                let choice = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.DeckOfWonder.Mischief.Choose', [['CHRISPREMADES.Macros.DeckOfWonder.Mischief.Cards', 'cards'], ['CHRISPREMADES.Macros.DeckOfWonder.Mischief.Item', 'item']]);
                if (!choice) choice = 'item';
                if (choice == 'cards') {
                    i -= 2;
                    continue;
                }
                break;
            }
            case 'mystery': {
                i--;
                await itemUtils.setConfig(workflow.item, 'mysteryDrawn', true);
                cards = cards.filter(i => activityUtils.getIdentifier(i) != 'mystery');
                break;
            }
        }
        await workflowUtils.syntheticActivityRoll(selection, [workflow.token]);
    }
}
async function beginning({trigger, workflow}) {
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.changes[0].value = workflow.utilityRolls[0].total;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
    await workflowUtils.applyDamage([workflow.token], workflow.utilityRolls[0].total, 'healing');
}
async function chancellor({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'deckOfWonderChancellor');
    if (!effect) return;
    let spellCompendium = genericUtils.getCPRSetting('spellCompendium');
    if (!game.packs.get(spellCompendium)) return;
    let spellData = await compendiumUtils.getItemFromCompendium(spellCompendium, 'Augury', {object: true});
    if (!spellData) return;
    spellData.system.method = 'innate';
    spellData.system.uses.max = 1;
    await itemUtils.createItems(workflow.actor, [spellData], {parentEntity: effect});
}
async function chaos({trigger, workflow}) {
    let type = await dialogUtils.selectDamageType(['acid', 'cold', 'fire', 'lightning', 'thunder'], workflow.activity.name, 'CHRISPREMADES.Generic.SelectDamageType', {userId: socketUtils.gmID()});
    if (!type) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.changes[0].value = type;
    effectData.duration = {seconds: workflow.utilityRolls[0].total * 86400};
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function coin({trigger, workflow}) {
    let documentName = workflow.utilityRolls[0].total === 1 ? 'Jewlery' : 'Gemstone';
    let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, documentName, {object: true, translate: 'CHRISPREMADES.Macros.DeckOfWonder.' + documentName});
    if (!itemData) return;
    if (documentName === 'Jewlery') {
        itemData.system.quantity = 5;
    } else {
        itemData.system.quantity = 10;
    }
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function crown({trigger, workflow}) {
    let friends = workflow.actor.items.getName('Friends');
    if (friends) return;
    let spellCompendium = genericUtils.getCPRSetting('spellCompendium');
    if (!game.packs.get(spellCompendium)) return;
    let spellData = await compendiumUtils.getItemFromCompendium(spellCompendium, 'Friends', {object: true});
    if (!spellData) return;
    await itemUtils.createItems(workflow.actor, [spellData]);
}
async function destiny({trigger: {entity: effect}, ditem}) {
    if (ditem.newHP > 0 || !ditem.isHit) return;
    workflowUtils.preventDeath(ditem);
    await genericUtils.remove(effect);
}
async function end({trigger, workflow}) {
    let damage = Math.floor(workflow.damageList[0].hpDamage);
    if (!damage) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'deckOfWonderEndEffect');
    if (effect) await genericUtils.remove(effect);
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let tempMaxReduction = Math.max((workflow.actor.system.attributes.hp.tempmax ?? 0) - damage, 10 - workflow.actor.system.attributes.hp.max);
    let delta = tempMaxReduction - (workflow.actor.system.attributes.hp.tempmax ?? 0);
    if (delta >= 0) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    effectData.changes[0].value = delta;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function isolation({trigger, workflow}) {
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = {seconds: workflow.utilityRolls[0].total * 60};
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function isolationEnd({trigger: {entity: effect}}) {
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let activity = activityUtils.getActivityByIdentifier(originItem, 'isolationEnd');
    if (!activity) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    await workflowUtils.syntheticActivityRoll(activity, [token]);
}
async function justiceRoll({trigger: {token, roll}}) {
    if (!roll.hasAdvantage && !roll.hasDisadvantage) return;
    if (!token) return;
    for (let target of token.scene.tokens) {
        let effect = effectUtils.getEffectByIdentifier(target.actor, 'deckOfWonderJusticeEffect');
        if (!effect) continue;
        if (actorUtils.hasUsedReaction(target.actor)) continue;
        if (tokenUtils.getDistance(token, target) > 60) continue;
        let selection = await dialogUtils.queuedConfirmDialog(effect.name, genericUtils.format('CHRISPREMADES.Macros.DeckOfWonder.UseJusticeFor', {name: token.document.name}), {actor: target.actor, reason: 'reaction', userId: socketUtils.firstOwner(target.actor, true)});
        if (!selection) continue;
        roll._formula = roll._formula.replace(/\b2d20kh\b|\b2d20kl\b/gi, '1d20');
        if (combatUtils.inCombat()) await actorUtils.setReactionUsed(target.actor);
        return;
    }
}
async function justiceRollSelf({trigger: {entity: effect, roll, actor}}) {
    if (!roll.hasAdvantage && !roll.hasDisadvantage) return;
    if (actorUtils.hasUsedReaction(actor)) return;
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.DeckOfWonder.UseJustice');
    if (!selection) return;
    roll._formula = roll._formula.replace(/\b2d20kh\b|\b2d20kl\b/gi, '1d20');
    if (combatUtils.inCombat()) await actorUtils.setReactionUsed(actor);
}
async function knife({trigger, workflow}) {
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let pack = game.packs.get(itemCompendium);
    if (!pack) return;
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.rarity', 'system.type.baseItem']});
    let filteredIndex = packIndex.filter(i => i.system.rarity === 'uncommon' && i.type === 'weapon' && workflow.actor.system.traits.weaponProf.value.has(i.system.type.baseItem));
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.DeckOfWonder.Knife', filteredIndex, {sortAlphabetical: true, userId: socketUtils.gmID()});
    if (!selection) return;
    let itemData = genericUtils.duplicate(selection.toObject());
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function lock({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'deckOfWonderLock');
    if (!effect) return;
    let spellCompendium = genericUtils.getCPRSetting('spellCompendium');
    if (!game.packs.get(spellCompendium)) return;
    let spellData = await compendiumUtils.getItemFromCompendium(spellCompendium, 'Knock', {object: true});
    if (!spellData) return;
    spellData.system.method = 'innate';
    spellData.system.uses.max = workflow.utilityRolls[0].total;
    await itemUtils.createItems(workflow.actor, [spellData], {parentEntity: effect});
}
async function mischief({trigger, workflow}) {
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let pack = game.packs.get(itemCompendium);
    if (!pack) return;
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.rarity', 'system.type.value']});
    let filteredIndex = packIndex.filter(i => i.system.rarity === 'uncommon' && i.system.type === 'wondrous');
    if (!filteredIndex.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.DeckOfWonder.Mischief.Select', filteredIndex, {sortAlphabetical: true, userId: socketUtils.gmID()});
    if (!selection) return;
    let itemData = genericUtils.duplicate(selection.toObject());
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function order({trigger, workflow}) {
    let type = await dialogUtils.selectDamageType(['force', 'necrotic', 'poison', 'psychic', 'radiant'], workflow.activity.name, 'CHRISPREMADES.Generic.SelectDamageType', {userId: socketUtils.gmID()});
    if (!type) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.changes[0].value = type;
    effectData.duration = {seconds: workflow.utilityRolls[0].total * 86400};
    effectData.origin = sourceEffect.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function student({trigger, workflow}) {
    let wisProf = workflow.actor.system.abilities.wis.proficient;
    if (!wisProf) {
        await genericUtils.update(workflow.actor, {'system.abilities.wis.proficient': 1});
    } else {
        let intProf = workflow.actor.system.abilities.int.proficient;
        let chaProf = workflow.actor.system.abilities.cha.proficient;
        if (intProf && chaProf) return;
        if (!chaProf && intProf) {
            await genericUtils.update(workflow.actor, {'system.abilities.cha.proficient': 1});
        } else if (chaProf && !intProf) {
            await genericUtils.update(workflow.actor, {'system.abilities.int.proficient': 1});
        } else {
            let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAProficency', [[CONFIG.DND5E.abilities.int.label, 'int'], [CONFIG.DND5E.abilities.cha.label, 'cha']]);
            if (!selection) selection = 'int';
            let key = 'system.abilities.' + selection + '.proficient';
            await genericUtils.update(workflow.actor, {[key]: 1}); 
        }
    }
}
async function vulture({trigger, workflow}) {
    let items = workflow.actor.items.filter(i => constants.itemTypes.includes(i.type) && !i.system.properties?.has('mgc'));
    if (!items.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.DeckOfWonder.Vulture.Select', items, {sortAlphabetical: true, userId: socketUtils.gmID()});
    if (!selection) return;
    let sourceEffect = workflow.activity.effects[1]?.effect;
    if (!sourceEffect) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'deckOfWonderVultureEffect');
    if (!effect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = sourceEffect.uuid;
    effectData.changes = [
        {
            key: 'name',
            value: genericUtils.translate('CHRISPREMADES.Macros.DeckOfWonder.Vulture.Lost'),
            mode: 5,
            priority: 50
        }
    ];
    if (selection.system.equipped) effectData.changes.push({
        key: 'system.equipped',
        value: 0,
        mode: 5,
        priority: 50
    });
    await itemUtils.enchantItem(selection, effectData, {parentEntity: effect});
}
async function vultureEnd({trigger: {entity: effect}}) {
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.DeckOfWonder.Vulture.Found', {userId: socketUtils.gmID()});
    if (!selection) await genericUtils.remove(effect.parent);
}
export let deckOfWonder = {
    name: 'Deck of Wonder',
    version: '1.3.98',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: beginning,
                priority: 50,
                activities: ['beginning']
            },
            {
                pass: 'rollFinished',
                macro: chancellor,
                priority: 50,
                activities: ['chancellor']
            },
            {
                pass: 'rollFinished',
                macro: chaos,
                priority: 50,
                activities: ['chaos']
            },
            {
                pass: 'rollFinished',
                macro: coin,
                priority: 50,
                activities: ['coin']
            },
            {
                pass: 'rollFinished',
                macro: crown,
                priority: 50,
                activities: ['crown']
            },
            {
                pass: 'rollFinished',
                macro: end,
                priority: 50,
                activities: ['end']
            },
            {
                pass: 'rollFinished',
                macro: isolation,
                priority: 50,
                activities: ['isolation']
            },
            {
                pass: 'rollFinished',
                macro: knife,
                priority: 50,
                activities: ['knife']
            },
            {
                pass: 'rollFinished',
                macro: lock,
                priority: 50,
                activities: ['lock']
            },
            {
                pass: 'rollFinished',
                macro: mischief,
                priority: 50,
                activities: ['mischief']
            },
            {
                pass: 'rollFinished',
                macro: order,
                priority: 50,
                activities: ['order']
            },
            {
                pass: 'rollFinished',
                macro: student,
                priority: 50,
                activities: ['student']
            },
            {
                pass: 'rollFinished',
                macro: vulture,
                priority: 50,
                activities: ['vulture']
            }
        ]
    },
    config: [
        {
            value: 'deckSize',
            label: 'CHRISPREMADES.Macros.DeckOfWonder.Size',
            type: 'select',
            default: '13',
            options: [
                {
                    value: '13',
                    label: '13'
                },
                {
                    value: '22',
                    label: '22'
                }
            ],
            category: 'mechanics'
        },
        {
            value: 'selectCard',
            label: 'CHRISPREMADES.Macros.DeckOfWonder.SelectCard',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'mysteryDrawn',
            label: 'CHRISPREMADES.Macros.DeckOfWonder.DysteryDrawn',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
};
export let deckOfWonderDestinyEffect = {
    name: 'Deck of Wonder: Destiny',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: destiny,
                priority: 45
            }
        ]
    }
};
export let deckOfWonderIsolationEffect = {
    name: 'Deck of Wonder: Isolation',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    effect: [
        {
            pass: 'deleted',
            macro: isolationEnd,
            priority: 50
        }
    ]
};
export let deckOfWonderJusticeEffect = {
    name: 'Deck of Wonder: Justice',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    d20: [
        {
            pass: 'scenePreEvaluation',
            macro: justiceRoll,
            priority: 50
        },
        
        {
            pass: 'preEvaluation',
            macro: justiceRollSelf,
            priority: 50
        }
    ]
};
export let deckOfWonderVultureLostEffect = {
    name: 'Deck of Wonder: Vulture',
    version: deckOfWonder.version,
    rules: deckOfWonder.rules,
    effect: [
        {
            pass: 'deleted',
            macro: vultureEnd,
            priority: 50
        }
    ]
};