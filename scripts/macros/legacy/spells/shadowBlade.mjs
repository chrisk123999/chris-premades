import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
async function createSword(document, workflow) {
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'shadowBlade');
    if (!effect) {
        Logging.addMacroWarning('CPR', 'shadow-blade', 'Shadow Blade effect missing from ' + workflow.actor.name + '.', {notify: 'warn'});
        return;
    }
    const swordData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'shadow-blade-sword', {object: true, translate: 'CHRISPREMADES.Macros.Legacy.ShadowBlade.Sword'});
    if (!swordData) {
        Logging.addMacroWarning('CPR', 'shadow-blade', 'Shadow Blade Sword missing from the automation items compendium.', {notify: 'warn'});
        return;
    }
    const castLevel = workflowUtils.getCastLevel(workflow) ?? document.system.level;
    const base = swordData.system.damage.base;
    base.number = Math.min(automationUtils.getConfigValue(document, 'maxDice'), automationUtils.getConfigValue(document, 'baseDice') + Math.floor((castLevel - 1) / 2));
    base.denomination = Number(automationUtils.getConfigValue(document, 'dieSize').slice(1));
    base.types = [automationUtils.getConfigValue(document, 'damageType')];
    const [sword] = await itemUtils.createItems(workflow.actor, [swordData], {favorite: true, parentEntity: effect});
    return sword;
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'cast') return;
    if (await createSword(document, workflow)) return;
    await effectUtils.endConcentration(workflow.actor, workflow.item);
}
async function recall({document, workflow}) {
    if (workflow.activity.identifier !== 'recall') return;
    if (actorUtils.getItemByIdentifier(workflow.actor, 'shadow-blade-sword')) {
        Logging.addMacroWarning('CPR', 'shadow-blade', 'Shadow Blade Sword already present.');
        return;
    }
    await createSword(document, workflow);
}
async function thrown({document, workflow}) {
    if (workflow.attackMode !== 'thrown') return;
    await documentUtils.deleteDocument(document);
}
export const shadowBlade = {
    name: 'Shadow Blade',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: recall,
            priority: 50
        }
    ],
    config: {
        damageType: {
            default: 'psychic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            homebrew: true,
            get options() { return constants.damageTypeOptions; }
        },
        dieSize: {
            default: 'd8',
            type: 'select',
            label: 'CHRISPREMADES.Config.DiceSize',
            category: 'homebrew',
            homebrew: true,
            get options() { return constants.diceSizeOptions; }
        },
        baseDice: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            category: 'homebrew',
            homebrew: true
        },
        maxDice: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Max',
            category: 'homebrew',
            homebrew: true
        }
    }
};
export const shadowBladeSword = {
    name: 'Shadow Blade: Sword',
    version: shadowBlade.version,
    rules: shadowBlade.rules,
    roll: [
        {
            pass: 'itemRollFinished',
            macro: thrown,
            priority: 50
        }
    ]
};
