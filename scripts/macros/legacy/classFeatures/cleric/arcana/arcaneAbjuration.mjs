import {activityUtils, actorUtils, automationUtils, constants, dataUtils, documentUtils, effectUtils, Logging, rollUtils} from '../../../../../proxy.mjs';
async function abjure({macroClass: {identifier, source}, workflow}) {
    if (!workflow.failedSaves.count) return;
    const turned = ((await workflow.activity.effects[0]?.getEffect()) ?? workflow.item.effects.contents[0])?.toObject();
    if (!turned) return Logging.addMacroWarning(source, identifier, `Arcane Abjuration exited early without locating its active effect. (activity) ${workflow.activity.uuid}`);
    const banish = documentUtils.getEffectByIdentifier(workflow.item, 'banished')?.toObject();
    if (!banish) Logging.addMacroWarning(source, identifier, `Arcane Abjuration could not find its banish active effect. (activity) ${workflow.activity.uuid} (effect identifier) banished`);
    else {
        dataUtils.setOrigin(banish, workflow.activity);
        banish.duration = activityUtils.getEffectDuration(workflow.activity);
    }
    dataUtils.setOrigin(turned, workflow.activity);
    turned.duration = activityUtils.getEffectDuration(workflow.activity);
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(arcaneAbjuration.config));
    const canBanish = banish && actorUtils.getLevelOrCR(workflow.actor) >= config.level;
    const banishCR = canBanish ? (await rollUtils.rollDice(config.banish, {workflow}))?.total ?? -1 : -1;
    await Promise.all(workflow.failedSaves.documents.map(t => {
        if (t.actor?.system.attributes.hp.value === 0) return;
        const effects = [turned];
        if (canBanish && actorUtils.getCR(t.actor) <= banishCR)
            effects.push(banish);
        return effectUtils.createEffects(t.actor, effects);
    }));
}
export const arcaneAbjuration = {
    name: 'Arcane Abjuration',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: abjure,
            priority: 50
        }
    ],
    config: {
        level: {
            default: '5',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.ArcaneAbjuration.GrantBanish',
            get options() { return constants.characterLevelOptions; }
        },
        banish: {
            default: '@scale.arcana.arcane-abjuration',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.ArcaneAbjuration.BanishCR'
        },
        subclassIdentifier: {
            default: 'arcana',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SubclassIdentifier'
        }
    },
    scales: [
        {
            identifier: 'arcane-abjuration',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'arcane-abjuration',
                    type: 'cr',
                    scale: {
                        5: {value: 0.5},
                        8: {value: 1},
                        11: {value: 2},
                        14: {value: 3},
                        17: {value: 4}
                    }
                },
                title: 'Arcane Abjuration'
            }
        }
    ]
};
