import {compendiumUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../utils.js';
async function rollItem(type, token, targets) {
    let key = genericUtils.getCPRSetting(type === 'critical' ? 'criticalCompendium' : 'fumbleCompendium');
    let pack = game.packs.get(key);
    if (!pack) {
        errors.missingPack();
        return;
    }
    let index = await pack.getIndex();
    if (!index.size) return;
    let mode = genericUtils.getCPRSetting('criticalFumbleMode');
    let random = [1, 3, 5];
    let itemData;
    if (random.includes(mode)) {
        let {roll} = await rollUtils.rollDice('1d' + index.size, {chatMessage: true});
        itemData = await compendiumUtils.getItemFromCompendium(key, index.contents[roll.total - 1].name, {object: true});
    } else {
        let item = await dialogUtils.selectDocumentDialog('CHRISPREMADES.Generic.Select', undefined, index.contents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {sensitivity: 'base'});
        }));
        if (!item) return;
        itemData = await compendiumUtils.getItemFromCompendium(key, item.name, {object: true});
    }
    let workflowTargets = Object.values(itemData.system.activities)[0]?.target.affects.type === 'self' ? [token] : targets;
    await workflowUtils.syntheticItemDataRoll(itemData, token.actor, workflowTargets);
}
async function attack(workflow) {
    if (!workflow.attackRoll || (!workflow.isCritical && !workflow.isFumble) || !workflow.token) return;
    if (workflow.isCritical) await rollItem('critical', workflow.token, Array.from(workflow.targets));
    if (workflow.isFumble) await rollItem('fumble', workflow.token, Array.from(workflow.targets));
}
export let critFumble = {
    attack
};
async function maxDamageUse({trigger, workflow}) {
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: itemUtils.convertDuration(trigger.entity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['maxDamageEffect']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'maxDamageEffect'});
}
async function maxDamageDamage({trigger, workflow}) {
    if (!workflow.damageRolls) return;
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        arr[i] = await damageRoll.reroll({maximize: true});
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.remove(trigger.entity);
}
export let maxDamage = {
    name: 'Maximize Damage',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: maxDamageUse,
                priority: 50
            }
        ]
    }
};
export let maxDamageEffect = {
    name: maxDamage.name,
    version: maxDamage.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: maxDamageDamage,
                priority: 450
            }
        ]
    }
};
async function doubleDamageUse({trigger, workflow}) {
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: itemUtils.convertDuration(trigger.entity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['doubleDamageEffect']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'doubleDamageEffect'});
}
async function doubleDamageDamage({trigger, workflow}) {
    if (!workflow.damageRolls) return;
    workflow.damageRolls.push(...workflow.damageRolls);
    await workflow.setDamageRolls(workflow.damageRolls);
    await genericUtils.remove(trigger.entity);
}
export let doubleDamage = {
    name: 'Double Damage',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: doubleDamageUse,
                priority: 50
            }
        ]
    }
};
export let doubleDamageEffect = {
    name: maxDamage.name,
    version: maxDamage.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: doubleDamageDamage,
                priority: 450
            }
        ]
    }
};