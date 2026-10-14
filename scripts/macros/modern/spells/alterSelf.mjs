import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, itemUtils, Logging} from '../../../proxy.mjs';
const growths = [
    ['Claws', 'slashing'],
    ['Fangs', 'piercing'],
    ['Horns', 'piercing'],
    ['Hooves', 'bludgeoning']
];
async function naturalWeapons({document, workflow}) {
    const cancel = () => effectUtils.endConcentration(workflow.actor, workflow.item);
    const unarmedStrike = actorUtils.getItemByIdentifier(workflow.actor, 'unarmed-strike');
    if (!unarmedStrike) {
        Logging.addMacroWarning('CPR', 'alter-self', _loc('CHRISPREMADES.Macros.Modern.AlterSelf.NoUnarmedStrike'), {notify: 'warn'});
        return cancel();
    }
    const buttons = growths.map(([growth, damageType]) => [_loc('CHRISPREMADES.Macros.Modern.AlterSelf.' + growth) + ' (' + CONFIG.DND5E.damageTypes[damageType].label + ')', growth]);
    const selection = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.AlterSelf.SelectGrowth'), buttons);
    if (!selection) return cancel();
    const damageType = growths.find(([growth]) => growth === selection)[1];
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name + ': ' + _loc('CHRISPREMADES.Macros.Modern.AlterSelf.' + selection),
        img: workflow.activity.img,
        origin: document.uuid,
        identifier: 'alterSelfNaturalWeapons',
        activityUuid: workflow.activity.uuid,
        changes: [
            {key: 'system.properties', type: 'add', value: 'mgc', priority: 20},
            {key: 'system.damage.base.custom.enabled', type: 'override', value: false, priority: 20},
            {key: 'system.damage.base.number', type: 'override', value: automationUtils.getConfigValue(document, 'dieCount'), priority: 20},
            {key: 'system.damage.base.denomination', type: 'override', value: automationUtils.getConfigValue(document, 'denomination'), priority: 20},
            {key: 'system.damage.base.bonus', type: 'override', value: '', priority: 20},
            {key: 'system.damage.base.types', type: 'override', value: [damageType], priority: 20},
            {key: 'activities[attack].attack.ability', type: 'override', value: workflow.activity.spellcastingAbility ?? 'spellcasting', priority: 20}
        ]
    });
    const enchantment = await itemUtils.enchantItem(unarmedStrike, effectData);
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (enchantment && concentrationEffect) await documentUtils.makeDependent(concentrationEffect, [enchantment]);
}
async function use({document, workflow}) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (workflow.token && animation?.macros?.play) animation.macros.play(workflow.token.document, workflow.token.document, options);
    if (workflow.activity.identifier === 'alter-self-natural-weapons') await naturalWeapons({document, workflow});
}
export const alterSelf = {
    name: 'Alter Self',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        dieCount: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            category: 'homebrew'
        },
        denomination: {
            default: 6,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.AlterSelf.Denomination',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'alterSelf'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
