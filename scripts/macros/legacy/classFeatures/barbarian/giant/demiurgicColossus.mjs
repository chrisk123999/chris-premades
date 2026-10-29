import {automationUtils, constants, genericUtils, rollUtils} from '../../../../../proxy.mjs';
async function editRage({data, document: item, macroClass: {source}}) {
    const config = automationUtils.getConfigValues(item, Object.keys(demiurgicColossus.config));
    config.giantReach = (await rollUtils.rollDice(config.giantReach, {document: item}))?.total;
    if (data.effectData.flags[source]?.rage.giantSize)
        data.effectData.flags[source].rage.giantSize.push(config.giantSize);
    else genericUtils.setProperty(data.effectData, `flags.${source}.rage.giantSize`, [config.giantSize]);
    genericUtils.setProperty(data.effectData, `flags.${source}.rage.elementalCleaver`, config.elementalCleaver);
    genericUtils.setProperty(data.effectData, `flags.${source}.rage.giantReach`, config.giantReach);
    genericUtils.setProperty(data.effectData, `flags.${source}.rage.impelSize`, config.impelSize);
}
export const demiurgicColossus = {
    name: 'Demiurgic Colossus',
    version: '2.1.5',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: editRage,
            priority: 275
        }
    ],
    config: {
        giantReach: {
            default: '10',
            type: 'text',
            category: 'behavior',
            label: 'DND5E.ITEM.Property.Reach',
            hint: 'CHRISPREMADES.Macros.Legacy.DemiurgicColossus'
        },
        giantSize: {
            default: 'huge',
            type: 'select',
            category: 'behavior',
            label: 'DND5E.Size',
            get options() { return constants.sizeOptions; }
        },
        elementalCleaver: {
            default: '2d6',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.ElementalCleaver.Damage',
            hint: 'CHRISPREMADES.Macros.Legacy.DemiurgicColossus'
        },
        impelSize: {
            default: 'lg',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.MightyImpel.Size',
            hint: 'CHRISPREMADES.Macros.Legacy.DemiurgicColossus',
            get options() { return constants.sizeOptions; }
        }
    }
};
