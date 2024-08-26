import {compendiumUtils, constants, effectUtils, workflowUtils} from '../../../../utils.js';

async function use({actor, token, args}) {
    let isSave = args[0].macroPass.startsWith('flags.midi-qol.optional.BardicInspiration.save');
    let formula = effectUtils.getEffectByIdentifier(actor, 'bardicInspirationInspired')?.flags['chris-premades']?.bardicInspiration?.formula;
    if (!formula) return;
    let rollToReturn = args[0].roll;
    formula = isSave ? ('1' + formula) : ('2' + formula + 'kh');
    let result = await new Roll('0 + ' + formula).evaluate();
    for (let term of result.terms.slice(1)) {
        rollToReturn.terms.push(term);
    }
    rollToReturn._total += result.total;
    rollToReturn._formula += result.formula.slice(1);
    if (!isSave) return rollToReturn;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Mote of Potential Heal', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BardicInspiration.MoteHeal'});
    if (!featureData) return rollToReturn;
    featureData.system.damage.parts = [
        [result.total + '[temphp]', 'temphp']
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [token]);
    return rollToReturn;
}
export let moteOfPotential = {
    name: 'Mote of Potential',
    version: '0.12.37',
    utilFunctions: {
        use
    }
};