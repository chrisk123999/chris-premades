import {activityUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils} from '../../../../utils.js';
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
        duration: itemUtils.convertDuration(workflow.activity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['stormAvatar']);
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier === 'stormgirdleA' || identifier === 'stormgirdleE') {
        effectData.changes.push({
            key: 'system.attributes.movement.fly',
            mode: 4,
            value: genericUtils.handleMetric(30),
            priority: 20
        });
        effectData.changes.push({
            key: 'system.attributes.movement.hover',
            mode: 5,
            value: 1,
            priority: 20
        });
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'stormgirdleLightningStrike', {strict: true});
    if (!feature) return;
    await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'stormAvatar',
        vae: [{
            type: 'use',
            name: feature.name,
            identifier: 'stormgirdle',
            activityIdentifier: 'stormgirdleLightningStrike'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['stormgirdleLightningStrike'],
            favorite: true
        }
    });
}
async function damage({trigger, workflow}) {
    if (!constants.weaponAttacks.includes(workflow.activity?.actionType)) return;
    if (!workflow.damageRolls.length) return;
    let rolls = await Promise.all(workflow.damageRolls.map(async roll => {
        switch(roll.options.type) {
            case 'piercing':
            case 'slashing': {
                let formula = roll.formula.replaceAll('piercing', 'lightning').replaceAll('slashing', 'lightning');
                return await rollUtils.damageRoll(formula, workflow.actor, {type: 'lightning'});
            }
            case 'bludgeoning': {
                let formula = roll.formula.replaceAll('bludgeoning', 'thunder');
                return await rollUtils.damageRoll(formula, workflow.actor, {type: 'thunder'});
            }
            default: return roll;
        }
    }));
    await workflow.setDamageRolls(rolls);
}
export let stormgirdleD = {
    name: 'Stormgirdle (Dormant)',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['stormgirdleD']
            }
        ]
    }
};
export let stormgirdleA = {
    name: 'Stormgirdle (Awakened)',
    version: stormgirdleD.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['stormgirdleA']
            }
        ]
    }
};
export let stormgirdleE = {
    name: 'Stormgirdle (Exalted)',
    version: stormgirdleD.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['stormgirdleE']
            }
        ]
    },
    equipment: {
        controlWeather: {
            name: 'Control Weather',
            compendium: 'personalSpell',
            uses: {
                spent: 0,
                max: 1,
                recovery: [
                    {
                        period: 'dawn',
                        type: 'recoverAll'
                    }
                ]
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