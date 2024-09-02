import {compendiumUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let effectData = {
        name: workflow.item.name + ': ' + genericUtils.translate('CHRISPREMADES.Macros.Stormgridle.Avatar'),
        changes: [
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'lightning',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'thunder',
                priority: 20
            }
        ],
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['stormAvatar']);
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier === 'stormgirdleA' || identifier === 'stormgirdleE') {
        effectData.changes.push({
            key: 'system.attributes.movement.fly',
            mode: 4,
            value: 1,
            priority: 20
        });
        effectData.changes.push({
            key: 'system.attributes.movement.hover',
            mode: 0,
            value: 1,
            priority: 20
        });
    }
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'stormAvatar'});
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let saveDC = itemUtils.getConfig(workflow.item, 'saveDC');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.itemFeatures, 'Stormgirdle: Lightning Strike', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Stormgirdle.LightningStrike', flatDC: saveDC});
    if (!featureData) return;
    featureData.system.damage.parts[0][0] = formula + '[' + damageType + ']';
    featureData.system.damage.parts[0][1] = damageType;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: workflow.item.name, parentEntity: effect});
}
async function damage({trigger, workflow}) {
    if (!constants.weaponAttacks.includes(workflow.item?.system?.actionType)) return;
    if (!workflow.damageRolls.length) return;
    let rolls = await Promise.all(workflow.damageRolls.map(async roll => {
        switch(roll.options.type) {
            case 'piercing':
            case 'slashing': {
                let formula = roll.formula.replaceAll('piercing', 'lightning').replaceAll('slashing', 'lightning');
                return await rollUtils.damageRoll(formula, workflow.actor, 'lightning');
            }
            case 'bludgeoning': {
                let formula = roll.formula.replaceAll('bludgeoning', 'thunder');
                return await rollUtils.damageRoll(formula, workflow.actor, 'thunder');
            }
            default: return roll;
        }
    }));
    await workflow.setDamageRolls(rolls);
}
export let stormgirdleD = {
    name: 'Stormgirdle (Dormant)',
    version: '0.12.48',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '3d6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'lightning',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'saveDC',
            label: 'CHRISPREMADES.CONFIG.SaveDC',
            type: 'text',
            default: '15',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let stormgirdleA = {
    name: 'Stormgirdle (Awakened)',
    version: stormgirdleD.version,
    midi: stormgirdleD.midi,
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '4d6',
            homebrew: true,
            category: 'homebrew'
        },
        stormgirdleD.config[1],
        stormgirdleD.config[2]
    ]
};
export let stormgirdleE = {
    name: 'Stormgirdle (Exalted)',
    version: stormgirdleD.version,
    midi: stormgirdleD.midi,
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '5d6',
            homebrew: true,
            category: 'homebrew'
        },
        stormgirdleD.config[1],
        stormgirdleD.config[2]
    ],
    equipment: {
        controlWeather: {
            name: 'Control Weather',
            compendium: 'personalSpell',
            uses: {
                value: 1,
                per: 'dawn',
                max: 1,
                recovery: 1
            },
            preparation: 'atwill'
        }
    }
};
export let stormAvatar = {
    name: 'Stormgirdle: Storm Avatar',
    version: stormgirdleD.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 340
            }
        ]
    }
};