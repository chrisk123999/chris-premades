import {automationUtils, constants, documentUtils, effectUtils, rollUtils} from '../../../proxy.mjs';
async function drink({workflow}) {
    const actor = (workflow.targets.first() ?? workflow.token)?.actor ?? workflow.actor;
    const config = automationUtils.getConfigValues(workflow.item, configKeys);
    await effectUtils.createItemEffect(actor, workflow.item, 'giantSizeEffect1', {config, changeValues: {'system.abilities.str.value': String(config.strength), 'system.traits.size': config.size}});
}
async function created({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    const sizes = Object.keys(CONFIG.DND5E.actorSizes);
    if (sizes.indexOf(actor._source.system.traits.size) > sizes.indexOf('med')) {
        await documentUtils.deleteDocument(effect);
        return;
    }
    const hp = actor.system.attributes.hp;
    const changes = effect.toObject().system.changes;
    changes.push({key: 'system.attributes.hp.tempmax', type: 'add', value: String(hp.max), phase: 'initial', priority: 20});
    await documentUtils.update(effect, {'system.changes': changes});
    await documentUtils.update(actor, {'system.attributes.hp.value': hp.value * 2});
}
async function damage({document: effect, workflow}) {
    if (workflow.item?.type !== 'weapon' || !workflow.damageRolls?.length) return;
    const multiplier = automationUtils.getOriginConfigValue(effect, 'diceMultiplier') ?? potionOfGiantSize.config.diceMultiplier.default;
    const damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        const formula = roll.terms.map(term => term instanceof foundry.dice.terms.DiceTerm ? term.formula.replace(/^(\d+)d/, (_match, number) => (Number(number) * multiplier) + 'd') : term.formula).join('');
        const damageRoll = await rollUtils.damageRoll(formula, workflow.activity, {...roll.options, isCritical: false});
        damageRoll.options.isCritical = roll.options.isCritical;
        return damageRoll;
    }));
    await workflow.setDamageRolls(damageRolls);
}
async function deleted({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor) return;
    const hp = actor.system.attributes.hp;
    const excess = actor._source.system.attributes.hp.value - hp.effectiveMax;
    if (excess <= 0) return;
    await documentUtils.update(actor, {'system.attributes.hp.value': hp.effectiveMax, 'system.attributes.hp.temp': Math.max(hp.temp ?? 0, excess)});
}
export const potionOfGiantSize = {
    name: 'Potion of Giant Size',
    version: '2.1.5',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: drink,
            priority: 50
        }
    ],
    config: {
        diceMultiplier: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.PotionOfGiantSize.DiceMultiplier',
            category: 'homebrew'
        },
        strength: {
            default: 25,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.PotionOfGiantSize.Strength',
            category: 'homebrew'
        },
        size: {
            default: 'huge',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Legacy.PotionOfGiantSize.Size',
            category: 'homebrew',
            get options() { return constants.sizeOptions; }
        }
    }
};
export const potionOfGiantSizeEffect = {
    name: 'Potion of Giant Size: Effect',
    version: potionOfGiantSize.version,
    rules: potionOfGiantSize.rules,
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 10
        }
    ],
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ]
};
const configKeys = Object.keys(potionOfGiantSize.config);
