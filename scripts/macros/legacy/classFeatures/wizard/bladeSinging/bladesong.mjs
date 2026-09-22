import {actorUtils, automationUtils, constants, documentUtils, effectUtils, genericUtils} from '../../../../../proxy.mjs';
async function preChecks({workflow}) {
    if (!automationUtils.getConfigValue(workflow.item, 'enforceArmorRestriction')) return;
    const armorType = workflow.actor.system.attributes.ac.equippedArmor?.system.type.value;
    const hasShield = !!workflow.actor.system.attributes.ac.equippedShield;
    if (!['medium', 'heavy'].includes(armorType) && !hasShield) return;
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.Bladesong.ArmorRestriction', {type: 'warn'});
    workflow.aborted = true;
    return true;
}
async function use({workflow}) {
    const ability = automationUtils.getConfigValue(workflow.item, 'spellcastingAbility') ?? 'int';
    const bonus = '+@abilities.' + ability + '.mod';
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        identifier: 'bladesong',
        changes: [
            {key: 'system.attributes.ac.bonus', type: 'add', value: bonus, priority: 20},
            {key: 'system.attributes.movement.walk', type: 'add', value: '+10', priority: 20},
            {key: 'flags.midi-qol.advantage.skill.acr', type: 'custom', value: '1', priority: 20},
            {key: 'system.attributes.concentration.bonuses.save', type: 'add', value: bonus, priority: 20}
        ]
    });
    if (actorUtils.getItemByIdentifier(workflow.actor, 'song-of-victory')) {
        effectData.system.changes.push({key: 'system.bonuses.mwak.damage', type: 'add', value: bonus, priority: 20});
    }
    const macros = [];
    if (actorUtils.getItemByIdentifier(workflow.actor, 'song-of-defense')) {
        macros.push({type: 'roll', macros: [{source: 'chris-premades', identifier: 'song-of-defense', rules: '2014'}]});
    }
    await effectUtils.createEffects(workflow.actor, [effectData], {macros, specialDuration: ['zeroHP']});
}
export const bladesong = {
    name: 'Bladesong',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: preChecks,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        enforceArmorRestriction: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.Bladesong.EnforceArmorRestriction',
            category: 'mechanics'
        },
        spellcastingAbility: {
            default: 'int',
            type: 'select',
            get options() { return constants.abilityOptions(); },
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew'
        }
    }
};
