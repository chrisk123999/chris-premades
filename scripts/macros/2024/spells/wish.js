import {activityUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function stress({trigger, workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier === 'duplicateSpell' || activityIdentifier === 'stressDamage') return;
    let strEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'wishStress');
    if (strEffect) await genericUtils.remove(strEffect);
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'wishStress');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    let roll = await rollUtils.rollDice(itemUtils.getConfig(workflow.item, 'stressDurationFormula'), {chatMessage: true, flavor: workflow.item.name});
    effectData.duration.seconds = roll.roll.total * 86400;
    effectData.origin = workflow.item.uuid;
    await effectUtils.createEffect(workflow.actor, effectData);
    let chanceNumber = itemUtils.getConfig(workflow.item, 'chanceNumber');
    if (!chanceNumber) return;
    let chanceRoll = await rollUtils.rollDice(itemUtils.getConfig(workflow.item, 'chanceFormula'), {chatMessage: true, flavor: workflow.item.name});
    if (chanceRoll.roll.total > chanceNumber) return;
    await itemUtils.setConfig(workflow.item, 'blocked', true);
}
async function early({trigger, workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier === 'stressDamage') return;
    if (!itemUtils.getConfig(workflow.item, 'blocked')) return;
    genericUtils.notify('CHRISPREMADES.Macros.Wish.BlockedWarn', 'warn');
    workflow.aborted = true;
}
async function instantHealth({trigger, workflow}) {
    async function targetHelper(token) {
        let statusIds = itemUtils.getConfig(workflow.item, 'instantHealthConditions');
        await Promise.all(statusIds.map(async statusId => {
            let effect = effectUtils.getEffectByStatusID(token.actor, statusId);
            if (effect) await genericUtils.remove(effect);
        }));
        await Promise.all(token.actor.effects.map(async effect => {
            let abilities = Object.keys(CONFIG.DND5E.abilities);
            let found = false;
            abilities.forEach(ability => {
                if (found) return;
                if (effect.changes.find(i => i.key === 'system.abilities.' + ability + '.value' && i.value < 0)) found = true;
            });
            if (effect.changes.find(i => i.key === 'system.attributes.hp.tempmax' && i.value < 0)) found = true;
            if (found) await genericUtils.remove(effect);
        }));
        await genericUtils.update(token.actor, {'system.attributes.hp.value': token.actor.system.attributes.hp.max});
    }
    if (!workflow.targets.includes(workflow.token)) await targetHelper(workflow.token);
    await Promise.all(workflow.targets.map(async token => await targetHelper(token)));
}
async function resistance({trigger, workflow}) {
    let selection = await dialogUtils.selectDamageType(Object.keys(CONFIG.DND5E.damageTypes).filter(i => !['midi-none', 'none'].includes(i)), workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) return;
    let resistanceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'wishResistance');
    if (!resistanceEffect) return;
    let effectData = genericUtils.duplicate(resistanceEffect.toObject());
    effectData.origin = workflow.item.uuid;
    effectData.changes[0].value = selection;
    await Promise.all(workflow.targets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
}
async function spellImmunity({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let key = genericUtils.getCPRSetting('spellCompendium');
    let pack = game.packs.get(key);
    if (!pack) {
        errors.missingPack();
        return;
    }
    let index = await pack.getIndex();
    if (!index.size) return;
    let item = await dialogUtils.selectDocumentDialog('CHRISPREMADES.Generic.SelectSpell', undefined, index.contents.sort((a, b) => {
        return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
    }));
    if (!item) return;
    let immuneEffect = itemUtils.getEffectByIdentifier(workflow.item, 'wishImmunity');
    if (!immuneEffect) return;
    let effectData = genericUtils.duplicate(immuneEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.origin = workflow.item.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.wish.spellImmunity', item.name);
    await Promise.all(workflow.targets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
}
async function duplicateSpell({trigger, workflow}) {
    let key = genericUtils.getCPRSetting('spellCompendium');
    let pack = game.packs.get(key);
    if (!pack) {
        errors.missingPack();
        return;
    }
    let index = await pack.getIndex({fields: ['system.level']});
    if (!index.size) return;
    let selection = await dialogUtils.selectDocumentDialog('CHRISPREMADES.Generic.SelectSpell', undefined, index.contents.filter(i => i.system.level <= itemUtils.getConfig(workflow.item, 'maxLevel')).sort((a, b) => {
        return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
    }));
    if (!selection) return;
    let itemUuid = selection.uuid;
    let document = await fromUuid(itemUuid);
    if (!document) return;
    let itemData = genericUtils.duplicate(document.toObject());
    itemData.system.properties = itemData.system.properties.filter(i => !['vocal', 'somatic', 'material'].includes(i));
    itemData.system.materials = {
        value: '',
        consumed: false,
        cost: 0,
        supply: 0
    };
    itemData.system.preparation.mode = 'innate';
    itemData.system.activation.type = 'special';
    let item = await itemUtils.syntheticItem(itemData, workflow.actor);
    await workflowUtils.completeItemUse(item, undefined, {configureDialog: false});
}
async function stressSpellDamage({trigger: {entity: effect}, workflow}) {
    if (workflow.item?.type !== 'spell' || !workflow.castData) return;
    let level = workflowUtils.getCastLevel(workflow);
    if (!level) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let activity = activityUtils.getActivityByIdentifier(originItem, 'stressDamage', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(originItem.toObject());
    itemData.system.activities[activity.id].damage.parts[0].number = level;
    let item = await itemUtils.syntheticItem(itemData, workflow.actor);
    let newActivity = item.system.activities.get(activity.id);
    await workflowUtils.syntheticActivityRoll(newActivity, [workflow.token]);
}
async function rest({trigger: {entity: effect}}) {
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.Wish.Rest', {buttons: 'yesNo'});
    if (!selection) return;
    if (effect.duration.seconds - 86400 <= 0) {
        await genericUtils.remove(effect);
    } else {
        await genericUtils.update(effect, {'duration.seconds': effect.duration.seconds - 86400});
    }
}
async function targeted({trigger: {entity: effect, token}, workflow}) {
    if (workflow?.item?.type !== 'spell') return;
    let spellName = effect.flags['chris-premades']?.wish?.spellImmunity;
    if (!spellName) return;
    if (workflow.item.name != spellName) return;
    let newTargets = workflow.targets.difference(new Set([token]));
    await genericUtils.updateTargets(newTargets, socketUtils.firstOwner(workflow.actor));
    workflow.targets = newTargets;
}
export let wish = {
    name: 'Wish',
    version: '1.1.19',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: instantHealth,
                priority: 50,
                activities: ['instantHealth']
            },
            {
                pass: 'rollFinished',
                macro: resistance,
                priority: 50,
                activities: ['resistance']
            },
            {
                pass: 'rollFinished',
                macro: spellImmunity,
                priority: 50,
                activities: ['spellImmunity']
            },
            {
                pass: 'rollFinished',
                macro: duplicateSpell,
                priority: 50,
                activities: ['duplicateSpell']
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: stress,
                priority: 51
            }
        ]
    },
    config: [
        {
            value: 'stressDurationFormula',
            label: 'CHRISPREMADES.Macros.Wish.StressDuration',
            type: 'text',
            default: '2d4',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'chanceFormula',
            label: 'CHRISPREMADES.Macros.Wish.ChanceFormula',
            type: 'text',
            default: '1d100',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'chanceNumber',
            label: 'CHRISPREMADES.Macros.Wish.ChanceNumber',
            type: 'number',
            default: 33,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'blocked',
            label: 'CHRISPREMADES.Macros.Wish.Blocked',
            type: 'checkbox',
            default: false,
            category: 'mechanics',
        },
        {
            value: 'instantHealthConditions',
            label: 'CHRISPREMADES.Macros.Wish.InstantHealthConditions',
            type: 'select-many',
            default: ['exhaustion', 'charmed', 'petrified'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'maxLevel',
            label: 'CHRISPREMADES.Macros.Wish.MaxLevel',
            type: 'number',
            default: 8,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let wishStress = {
    name: 'Wish: Stress',
    version: wish.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: stressSpellDamage,
                priority: 450
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ]
};
export let wishImmunity = {
    name: 'Wish: Spell Immunity',
    version: wish.version,
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: targeted,
                priority: 25
            }
        ]
    }
};