import cprConstants from '../../../constants.mjs';
import {automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.targets.size) {
        Logging.addMacroWarning('CPR', 'dragons-breath', 'No target selected.');
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const types = automationUtils.getConfigValue(document, 'damageTypes');
    const damageType = await dialogUtils.selectDamageType(types, document.name, 'CHRISPREMADES.Generic.SelectDamageType') || types[0];
    const featureData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'dragon-breath', {object: true, translate: 'CHRISPREMADES.Macros.All.DragonsBreath.DragonBreath', flatDC: itemUtils.getSaveDC(workflow.item)});
    if (!featureData) {
        Logging.addMacroWarning('CPR', 'dragons-breath', 'Dragon Breath missing from the automation items compendium.', {notify: 'warn'});
        await effectUtils.endConcentration(workflow.actor, workflow.item);
        return;
    }
    const part = Object.values(featureData.system.activities)[0].damage.parts[0];
    part.number = workflowUtils.getCastLevel(workflow) + automationUtils.getConfigValue(document, 'bonusDice');
    part.denomination = Number(automationUtils.getConfigValue(document, 'dieSize').slice(1));
    part.types = [damageType];
    for (const target of workflow.targets) {
        const effect = documentUtils.getEffectByIdentifier(target.actor, 'dragonsBreath', {sourceActor: workflow.actor});
        if (!effect) {
            Logging.addMacroWarning('CPR', 'dragons-breath', 'Dragon\'s Breath effect missing from ' + target.name + '.', {notify: 'warn'});
            continue;
        }
        await itemUtils.createItems(target.actor, [featureData], {favorite: true, parentEntity: effect});
    }
}
export const dragonsBreath = {
    name: 'Dragon\'s Breath',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        damageTypes: {
            default: ['acid', 'cold', 'fire', 'lightning', 'poison'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            homebrew: true,
            get options() { return constants.damageTypeOptions; }
        },
        dieSize: {
            default: 'd6',
            type: 'select',
            label: 'CHRISPREMADES.Config.DiceSize',
            category: 'homebrew',
            homebrew: true,
            get options() { return constants.diceSizeOptions; }
        },
        bonusDice: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.DragonsBreath.BonusDice',
            hint: 'CHRISPREMADES.Macros.All.DragonsBreath.BonusDiceHint',
            category: 'homebrew',
            homebrew: true
        }
    }
};
