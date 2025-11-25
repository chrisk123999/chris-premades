import {activityUtils, actorUtils,animationUtils, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';


function resolveResistanceSource(effects, damageDetail) {
    if (!effects?.length || !Array.isArray(damageDetail) || !damageDetail.length) {
        return { effect: null, type: null, damageInstance: null };
    }

    const damageTypes = [...new Set(
        effects.map(e => e.flags?.['chris-premades']?.info?.damageType).filter(Boolean)
    )];

    if (!damageTypes.length) {
        genericUtils.log('dev', 'Resistances found, but none with a damageType flag.');
        return { effect: null, type: null, damageInstance: null };
    }

    const totalsByType = damageTypes.map(type => ({
        type,
        total: workflowUtils.getTotalEffectiveDamageOfType(damageDetail, type) || 0
    }));

    genericUtils.logDetailed('dev', 'Totals by resistance type:', totalsByType);

    const allZero = totalsByType.every(entry => entry.total === 0);
    if (allZero) {
        genericUtils.log('dev', 'No effective damage of any resistance type was taken.');
        return { effect: null, type: null, damageInstance: null };
    }

    const highestType = totalsByType.sort((a, b) => b.total - a.total)[0].type;

    genericUtils.log('dev', `Highest damage type is ${highestType}, resistance will apply to this type.`);

    const effect = effects.find(
        e => e.flags?.['chris-premades']?.info?.damageType === highestType
    );
    if (!effect) {
        genericUtils.log('dev', 'Could not find a matching effect for highestType, this should not happen.');
        return { effect: null, type: null, damageInstance: null };
    }

    const damageInstance = workflowUtils.getHighestDamageInstance(damageDetail, highestType);
    if (!damageInstance) {
        genericUtils.log('dev', 'No damageInstance found for highestType, this should not happen.');
        return { effect: null, type: null, damageInstance: null };
    }

    return { effect, type: highestType, damageInstance };
}

async function playResistanceAnimation(targetToken, parentItem, damageType) {
    let playAnimation = itemUtils.getConfig(parentItem, 'playAnimation') === true;
    if (!playAnimation) return genericUtils.log('dev', 'Animation disabled in config');
    if (!targetToken) return genericUtils.log('dev', 'no target token found to play animation');;
    if (animationUtils.jb2aCheck() !== 'patreon') return genericUtils.log('dev', `patreon J2BA not detected`);
    const META = genericUtils.getDamageTypeMeta();
    genericUtils.logDetailed('dev', 'damageType', damageType, 'color', META[damageType]?.color)
    const effectColor = META[damageType]?.color ?? 'blue';
    new Sequence()
        .effect()
            .attachTo(targetToken)        
            .file(`jb2a.shield.01.complete.01.${effectColor}`)
            .scaleToObject(1.5 * targetToken.document.texture.scaleX)
            .fadeIn(0, {ease: 'easeOutCubic'})
            .fadeOut(1000, {ease: 'easeOutCubic'})
            .name('resistance')
            .play();
}

async function use({trigger, workflow}) {
    const META = genericUtils.getDamageTypeMeta();

    const ALLOWED = ['elemental', 'physical', 'divine'];

    const FILTERED_TYPES = Object.keys(META).filter(
        type => ALLOWED.includes(META[type].category)
    );
    const type = await dialogUtils.selectDamageType(
        FILTERED_TYPES,
        workflow.activity.name,
        'CHRISPREMADES.Generic.SelectDamageType', { addNo:true }
    );
    genericUtils.log('dev',`Type ${type} chosen, apply effect to target.`);
    if (!type) {
      await effectUtils.killConcentration(workflow?.actor, workflow?.item);
      return;
    }
    const targetToken = workflow?.targets?.values().next().value;
    if (!targetToken) {
      genericUtils.log('dev','no target found, exiting...')
      await effectUtils.killConcentration(workflow?.actor, workflow?.item)
      return;
    } 
    const effectData = {
        name: `Resistance (${genericUtils.titleCase(type)})`,
        img: META[type]?.image ?? workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                info: {
                    identifier: 'resistance',
                    damageType: type
                }
            }
        },
    };
    genericUtils.logDetailed('dev',`effect`, effectData);
    await effectUtils.createEffect(targetToken?.actor, effectData, {concentrationItem: workflow?.item})
}

// ** Damage Reduction Application ** //
async function damageApplication({ trigger: { token }, workflow, ditem }) {

    const actor = token?.actor;
    const damageDetail = ditem?.damageDetail;
    if (!actor || !Array.isArray(damageDetail) || !damageDetail.length) return;


    const effects = effectUtils.getAllEffectsByIdentifier(actor, 'resistance') ?? [];
    if (!effects.length) return;

    const { effect: sourceEffect, type: resistanceType, damageInstance } =
      resolveResistanceSource(effects, damageDetail);

    if (!sourceEffect || !resistanceType || !damageInstance) {
      return genericUtils.log('dev', 'No applicable resistance for this hit.');
    }

    const originDoc = sourceEffect.origin ? await fromUuid(sourceEffect.origin) : null;
    const parentCaster = originDoc?.parent;
    if (!parentCaster) return genericUtils.log('error','no parent caster found');

    const parentItem = await itemUtils.getItemByIdentifier(parentCaster, 'resistance');
    if (!parentItem) return;

    const alreadyUsed = await itemUtils.perTurnUsage(parentItem, token?.actor, false);
    genericUtils.log('dev',`alreadyUsed ${alreadyUsed}`);
    if (alreadyUsed) return;

    const rollActivity = activityUtils.getActivityByIdentifier(parentItem, 'resistanceRoll', {strict : true});
    genericUtils.logDetailed('dev','rollActivity',rollActivity);
    if (!rollActivity) return genericUtils.log('error','no roll activity found');

    const rollData = await workflowUtils.syntheticActivityDataRoll(rollActivity,parentItem,actor,[actorUtils.getFirstToken(actor)]);

    await playResistanceAnimation(actorUtils.getFirstToken(actor), parentItem, resistanceType)
    const oldValue = genericUtils.sanitizeNumber(damageInstance.value)
    const newValue = workflowUtils.calculateNewDamageValue({damageInstance : damageInstance, damageMod : -(rollData?.utilityRolls?.[0]?.total ?? 0), orderOfDamage : game.settings.get('midi-qol', 'ConfigSettings')?.saveDROrder ?? 'DRSaveDr'});

    // If nothing actually changed, don't bother mutating the ditem but mark as used (the spell is not guaranteed to reduce damage, just guaranteed to try)
    await itemUtils.perTurnUsage(parentItem, token?.actor, true);
    if (newValue - oldValue === 0) return;

    workflowUtils.modifyDamageItem(ditem, damageInstance, newValue);
}

export let resistance = {
    name: 'Resistance',
    version: '1.0.2',
    rules: 'modern',
    midi: {
        item : [
            { 
                pass: 'preambleComplete', 
                macro : use, 
                priority : 50,
                activities: ['resistance']
            }
        ],
        actor: [
            {
                pass : 'targetApplyDamage', 
                macro : damageApplication, 
                priority : 50
            },
        ]
    },
    config: [
        {
            value: 'allowMulti',
            label: 'CHRISPREMADES.Config.AllowMultiplePerTurn',
            type: 'checkbox',
            default: false,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};