import {actorUtils, automationUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function naturalAttack({document, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    let isNatural = workflow.item.system.type?.value === 'natural';
    if (!isNatural) {
        const identifiers = automationUtils.getConfigValues(document, ['itemIdentifiers', 'activityIdentifiers']);
        isNatural = identifiers.itemIdentifiers.includes(documentUtils.getIdentifier(workflow.item)) && identifiers.activityIdentifiers.includes(workflow.activity.identifier);
    }
    if (!isNatural) return;
    const config = automationUtils.getConfigValues(document, ['diceSteps', 'maxDenomination']);
    const itemData = workflow.item.toObject();
    if (workflow.item.type === 'weapon') {
        itemData.system.damage.base.denomination = Math.min(itemData.system.damage.base.denomination + config.diceSteps, config.maxDenomination);
    } else {
        const part = itemData.system.activities[workflow.activity.id].damage.parts[0];
        part.denomination = Math.min(part.denomination + config.diceSteps, config.maxDenomination);
    }
    workflow.item = itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'transform') return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'formOfTheBeastEffect');
    if (!sourceEffect) return;
    const config = automationUtils.getConfigValues(document, ['classIdentifier', 'animation', 'diceSteps', 'maxDenomination', 'itemIdentifiers', 'activityIdentifiers']);
    const levels = workflow.actor.classes[config.classIdentifier]?.system.levels ?? 0;
    const identifiers = ['bite', 'claw'];
    if (levels >= 5) identifiers.push('dash', 'hide');
    const activities = identifiers.map(identifier => itemUtils.getActivityByIdentifier(document, identifier)).filter(activity => activity);
    const vae = activities.map(activity => ({type: 'use', name: activity.name, identifier: 'form-of-the-beast-warlock', activityIdentifier: activity.identifier}));
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid,
        duration: levels >= 6 ? {seconds: 3600} : undefined,
        unhideActivities: identifiers,
        vae,
        deleteAnimation: config.animation,
        copyConfigs: {classIdentifier: config.classIdentifier, diceSteps: config.diceSteps, maxDenomination: config.maxDenomination, itemIdentifiers: config.itemIdentifiers, activityIdentifiers: config.activityIdentifiers}
    });
    effectUtils.pushImageChanges(effectData, document);
    const createEffect = async () => {
        const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'formOfTheBeastEffect');
        if (existing) {
            const temp = workflow.actor.system.attributes.hp.temp;
            await documentUtils.deleteDocument(existing);
            await documentUtils.update(workflow.actor, {'system.attributes.hp.temp': temp});
        }
        await effectUtils.createEffects(workflow.actor, [effectData]);
    };
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation) return await createEffect();
    await animation.macros.transform(workflow.token.document, {...options, callback: createEffect});
}
async function attack({workflow}) {
    if (!['bite', 'claw'].includes(workflow.activity.identifier)) return;
    const defaultAbility = workflow.activity.attack.ability || 'str';
    const bestAbility = actorUtils.getBestAbility(workflow.actor, [defaultAbility, 'cha']);
    if (bestAbility === defaultAbility) return;
    const activityData = workflow.activity.toObject();
    activityData.attack.ability = bestAbility;
    workflowUtils.setActivity(workflow, activityData);
}
export const formOfTheBeastWarlock = {
    name: 'Form of the Beast',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemPreambleComplete', macro: attack, priority: 25}
    ],
    get config() {
        return {
            ...effectUtils.getImageConfig(),
            classIdentifier: {
                default: 'warlock',
                type: 'text',
                label: 'CHRISPREMADES.Config.ClassIdentifier',
                category: 'homebrew'
            },
            diceSteps: {
                default: 2,
                type: 'number',
                label: 'CHRISPREMADES.Config.DiceSize',
                category: 'homebrew'
            },
            maxDenomination: {
                default: 12,
                type: 'number',
                label: 'CHRISPREMADES.Config.Max',
                category: 'homebrew'
            },
            itemIdentifiers: {
                default: ['harkons-bite'],
                type: 'selectIdentifiers',
                label: 'CHRISPREMADES.Config.Identifiers',
                category: 'homebrew'
            },
            activityIdentifiers: {
                default: ['bite', 'claws'],
                type: 'selectIdentifiers',
                label: 'CHRISPREMADES.Config.Activities',
                category: 'homebrew'
            },
            animation: {
                default: {
                    source: 'chris-premades',
                    identifier: 'shapeChange'
                },
                type: 'selectAnimation',
                inputs: ['token', 'options'],
                label: 'CHRISPREMADES.Config.Animation',
                category: 'visuals'
            }
        };
    }
};
async function supernaturallyKeen({skillId}) {
    if (!['prc', 'ste', 'sur'].includes(skillId)) return;
    return {
        label: 'CHRISPREMADES.Macros.Legacy.FormOfTheBeast.Keen',
        type: 'advantage'
    };
}
async function removed({document: effect}) {
    const actor = effect.parent;
    const levels = actor.classes[automationUtils.getConfigValue(effect, 'classIdentifier')]?.system.levels ?? 0;
    if (actor.system.attributes.hp.temp > Math.min(10, levels) * 2) return;
    await documentUtils.update(actor, {'system.attributes.hp.temp': 0});
}
export const formOfTheBeastWarlockEffect = {
    name: 'Form of the Beast: Transformed',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorPreambleComplete', macro: naturalAttack, priority: 30}
    ],
    skill: [
        {pass: 'actorContext', macro: supernaturallyKeen, priority: 50}
    ],
    effect: [
        {pass: 'deleted', macro: removed, priority: 50}
    ]
};
