import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, documentUtils, itemUtils, Logging} from '../../../proxy.mjs';
async function use({workflow}) {
    const actor = (workflow.targets.first() ?? workflow.token)?.actor ?? workflow.actor;
    const effect = actorUtils.getEffectByIdentifier(actor, 'potionOfFireBreath');
    if (!effect) return;
    const featureData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'potion-of-fire-breath-attack', {object: true, translate: 'CHRISPREMADES.Macros.All.PotionOfFireBreath.Attack'});
    if (!featureData) {
        Logging.addMacroWarning('CPR', 'potion-of-fire-breath', 'Potion of Fire Breath Attack missing from the automation items compendium.', {notify: 'warn'});
        return;
    }
    const config = automationUtils.getConfigValues(workflow.item, configKeys);
    const exhaleData = Object.values(featureData.system.activities)[0];
    exhaleData.damage.parts[0].number = config.dice;
    exhaleData.save.dc.formula = String(config.saveDC);
    featureData.system.uses.max = String(config.uses);
    await itemUtils.createItems(actor, [featureData], {favorite: true, parentEntity: effect});
}
async function exhale({workflow}) {
    if (workflow.actor.items.get(workflow.item.id)?.system.uses.value) return;
    const effect = actorUtils.getEffectByIdentifier(workflow.actor, 'potionOfFireBreath');
    if (effect) await documentUtils.deleteDocument(effect);
}
export const potionOfFireBreath = {
    name: 'Potion of Fire Breath',
    version: '2.1.5',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        dice: {
            default: 4,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.PotionOfFireBreath.Dice',
            category: 'homebrew'
        },
        saveDC: {
            default: 13,
            type: 'number',
            label: 'CHRISPREMADES.Config.SaveDC',
            category: 'homebrew'
        },
        uses: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.PotionOfFireBreath.Uses',
            category: 'homebrew'
        }
    }
};
export const potionOfFireBreathAttack = {
    name: 'Potion of Fire Breath Attack',
    version: potionOfFireBreath.version,
    rules: potionOfFireBreath.rules,
    roll: [
        {
            pass: 'itemRollFinished',
            macro: exhale,
            priority: 50
        }
    ]
};
const configKeys = Object.keys(potionOfFireBreath.config);
