import {actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function rollFinished({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'rerollSaveOnDamage');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let targets = workflow.failedSaves;
    if (!targets.size) return;
    await Promise.all(targets.map(async i => {
        let effect = actorUtils.getEffects(i.actor).find(j => {
            return !j?.origin ? false : workflow.activity.effects.map(k => k.effect.uuid).includes(j.origin) ? true : fromUuidSync(j.origin)?.flags?.dnd5e?.itemUuid === workflow.activity.uuid;
        });
        if (!effect) return;
        let currentMacroList = genericUtils.getProperty(effect, 'flags.chris-premades.macros.midi.actor') ?? [];
        await genericUtils.setFlag(effect, 'chris-premades', 'macros.midi.actor', currentMacroList.concat(['rerollSaveOnDamageActor']));
    }));
}
async function targetRollFinished({trigger: {entity, token}, workflow}) {
    if (!workflow.hitTargets.has(token)) return;
    let damage = workflow?.damageList?.find(i => i?.targetUuid === token.document.uuid);
    if (!damage) return;
    let damageTaken = damage.oldHP - damage.newHP;
    if (damageTaken <= 0) return;
    let sourceItem = await effectUtils.getOriginItem(entity);
    if (!sourceItem) return;
    let config = itemUtils.getGenericFeatureConfig(sourceItem, 'rerollSaveOnDamage');
    if (config.excludeSource && workflow.token.document.uuid === sourceItem.actor.token.uuid) return; 
    let sourceActivity = sourceItem.system.activities.find(i => i.effects.some(j => j.effect.uuid === entity.origin)) ?? fromUuidSync(fromUuidSync(entity.origin)?.flags?.dnd5e?.itemUuid);
    if (!sourceActivity) return;
    let activityData = sourceActivity.toObject();
    delete activityData._id;
    activityData.effects = [];
    if (config.saveDC) activityData.save.dc.formula = config.saveDC;
    let itemData = {
        name: sourceItem.name,
        img: sourceItem.img,
        type: sourceItem.type,
        system: {
            activities: {
                [activityData.name]: activityData
            },
            description: {
                value: sourceItem.system.description.value
            }
        }
    };
    let syntheticWorkflow = await workflowUtils.syntheticItemDataRoll(itemData, sourceItem.actor, [token]);
    if (syntheticWorkflow.failedSaves.has(token)) return;
    await genericUtils.remove(entity);
}
export let rerollSaveOnDamage = {
    name: 'Reroll Save On Damage',
    translation: 'CHRISPREMADES.Macros.RerollSaveOnDamage.Name',
    version: '1.3.30',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: rollFinished,
                priority: 50,
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'excludeSource',
            label: 'CHRISPREMADES.Macros.RerollSaveOnDamage.ExcludeSource',
            type: 'checkbox',
            default: false
        },
        {
            value: 'saveDC',
            label: 'CHRISPREMADES.Config.SaveDC',
            type: 'number',
            default: null
        }
    ]
};
export let rerollSaveOnDamageActor = {
    name: 'Reroll Save On Damage Actor',
    version: '1.3.30',
    midi: {
        actor: [
            {
                pass: 'targetRollFinished',
                macro: targetRollFinished,
                priority: 100
            }
        ]
    }
};