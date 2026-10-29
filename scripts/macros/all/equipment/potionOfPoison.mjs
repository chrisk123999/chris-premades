import {automationUtils, documentUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function disguise({workflow}) {
    if (workflow.activity.identifier !== 'potion-of-poison') return;
    await workflow.setDamageRolls([await rollUtils.damageRoll('0', workflow.activity, {type: 'healing'})]);
}
async function drink({workflow}) {
    if (workflow.activity.identifier !== 'potion-of-poison') return;
    const token = workflow.targets.first() ?? workflow.token;
    const poison = itemUtils.getActivityByIdentifier(workflow.item, 'potion-of-poison-damage');
    if (!token || !poison) return;
    const config = automationUtils.getConfigValues(workflow.item, configKeys);
    const itemData = workflow.item.toObject();
    const poisonData = poison.toObject();
    delete poisonData.flags.cat.hidden;
    const dice = config.dice || poisonData.damage.parts[0].number;
    poisonData.damage.parts[0].number = dice;
    poisonData.save.dc.formula = String(config.saveDC);
    const effectData = itemData.effects.find(effect => poisonData.effects.some(({_id}) => _id === effect._id));
    if (effectData) genericUtils.setProperty(effectData, 'flags.chris-premades.potionOfPoison', {dice, saveDC: config.saveDC});
    itemData.system.activities = {[poison.id]: poisonData};
    itemData.flags.cat.macros.roll = itemData.flags.cat.macros.roll.filter(macro => macro.identifier !== 'spellAnimation');
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [token.document ?? token], {consumeUsage: false, consumeResources: false});
}
async function turnStart({document: effect, token}) {
    const dice = effect.flags['chris-premades']?.potionOfPoison?.dice;
    if (!dice || !token) return;
    const {roll} = await rollUtils.rollDice(dice + 'd6', {document: token.actor, message: true, flavor: effect.name});
    await workflowUtils.applyDamage([token], roll.total, 'poison');
}
async function turnEnd({document: effect}) {
    const {dice, saveDC = potionOfPoison.config.saveDC.default} = effect.flags['chris-premades']?.potionOfPoison ?? {};
    const actor = effectUtils.getActor(effect);
    if (!dice || !actor) return;
    const roll = await rollUtils.requestRoll(actor, 'save', 'con', {rollDC: saveDC});
    if (!roll || roll.total < saveDC) return;
    if (dice <= 1) await documentUtils.deleteDocument(effect);
    else await documentUtils.setFlag(effect, 'chris-premades', 'potionOfPoison.dice', dice - 1);
}
export const potionOfPoison = {
    name: 'Potion of Poison',
    version: '2.1.5',
    rules: 'all',
    roll: [
        {
            pass: 'itemDamageRollComplete',
            macro: disguise,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: drink,
            priority: 50
        }
    ],
    config: {
        dice: {
            default: 0,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.PotionOfPoison.Dice',
            hint: 'CHRISPREMADES.Macros.All.PotionOfPoison.DiceHint',
            category: 'homebrew'
        },
        saveDC: {
            default: 13,
            type: 'number',
            label: 'CHRISPREMADES.Config.SaveDC',
            category: 'homebrew'
        }
    }
};
export const potionOfPoisonEffect = {
    name: 'Potion of Poison: Poisoned',
    version: potionOfPoison.version,
    rules: potionOfPoison.rules,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        },
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
const configKeys = Object.keys(potionOfPoison.config);
