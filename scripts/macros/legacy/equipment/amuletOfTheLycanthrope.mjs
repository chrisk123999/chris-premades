import {automationUtils, constants, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'use') return;
    if (!itemUtils.getEquipmentState(document)) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'amuletOfTheLycanthropeEffect');
    if (!sourceEffect) return;
    const identifiers = ['claws', 'human'];
    const activities = identifiers.map(identifier => itemUtils.getActivityByIdentifier(document, identifier)).filter(activity => activity);
    const vae = activities.map(activity => ({type: 'use', name: activity.name, identifier: 'amulet-of-the-lycanthrope', activityIdentifier: activity.identifier}));
    const config = automationUtils.getConfigValues(document, ['animation']);
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid,
        unhideActivities: identifiers,
        vae,
        deleteAnimation: config.animation
    });
    effectUtils.pushImageChanges(effectData, document);
    const createEffect = async () => {
        const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'amuletOfTheLycanthropeEffect');
        if (existing) await documentUtils.deleteDocument(existing);
        await effectUtils.createEffects(workflow.actor, [effectData]);
    };
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation) return await createEffect();
    await animation.macros.transform(workflow.token.document, {...options, callback: createEffect});
}
async function human({workflow}) {
    if (workflow.activity.identifier !== 'human') return;
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'amuletOfTheLycanthropeEffect');
    if (effect) await documentUtils.deleteDocument(effect);
}
function isHarkonsActivity(document, workflow, identifiers) {
    if (!itemUtils.getEquipmentState(document)) return false;
    if (documentUtils.getIdentifier(workflow.item) !== 'harkons-bite') return false;
    return identifiers.includes(workflow.activity.identifier);
}
async function saveBonus({document, workflow}) {
    if (!isHarkonsActivity(document, workflow, ['humanoid'])) return;
    const bonus = automationUtils.getConfigValue(document, 'saveBonus');
    const activityData = workflow.activity.toObject();
    activityData.save.dc.calculation = '';
    activityData.save.dc.formula = String(workflow.activity.save.dc.value + bonus);
    workflowUtils.setActivity(workflow, activityData);
}
async function damage({document, workflow}) {
    if (!isHarkonsActivity(document, workflow, ['bite', 'claws'])) return;
    const config = automationUtils.getConfigValues(document, ['formula', 'damageType']);
    await workflowUtils.bonusDamage(workflow, config.formula, {damageType: config.damageType});
}
async function keenHearingAndSmell({skillId}) {
    if (skillId !== 'prc') return;
    return {
        label: 'CHRISPREMADES.Macros.Legacy.HarkonsBite.Keen',
        type: 'advantage'
    };
}
export const amuletOfTheLycanthropeEffect = {
    name: 'Amulet of the Lycanthrope: Bestial Form',
    version: '2.0.0',
    rules: '2014',
    skill: [
        {pass: 'actorContext', macro: keenHearingAndSmell, priority: 50}
    ]
};
export const amuletOfTheLycanthrope = {
    name: 'Amulet of the Lycanthrope',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: human, priority: 50},
        {pass: 'actorPreambleComplete', macro: saveBonus, priority: 50},
        {pass: 'actorDamageRollComplete', macro: damage, priority: 60}
    ],
    get config() {
        return {
            ...effectUtils.getImageConfig(),
            formula: {
                default: '1d8',
                type: 'text',
                label: 'CHRISPREMADES.Config.Formula',
                category: 'homebrew'
            },
            saveBonus: {
                default: 3,
                type: 'number',
                label: 'CHRISPREMADES.Macros.Legacy.AmuletOfTheLycanthrope.SaveBonus',
                category: 'homebrew'
            },
            damageType: {
                default: 'necrotic',
                type: 'select',
                label: 'CHRISPREMADES.Config.DamageType',
                category: 'homebrew',
                get options() { return constants.damageTypeOptions(); }
            },
            animation: {
                default: {
                    source: 'chris-premades',
                    identifier: 'moonFrenzy'
                },
                type: 'selectAnimation',
                inputs: ['token', 'options'],
                label: 'CHRISPREMADES.Config.Animation',
                category: 'visuals'
            }
        };
    }
};
