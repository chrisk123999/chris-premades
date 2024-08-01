import {combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['sickeningRadianceTemplate']
                }
            }
        }
    });
}
async function startOrEnter({trigger: {entity: template, castData, token}}) {
    let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    if (!targetCombatant) return;
    if (!combatUtils.perTurnCheck(targetCombatant, 'sickeningRadiance')) return;
    await combatUtils.setTurnCheck(targetCombatant, 'sickeningRadiance');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Sickening Radiance: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SickeningRadiance.Damage', flatDC: castData.saveDC});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    let featureWorkflow = await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
    if (!featureWorkflow.failedSaves.size) return;
    let exhaustionLevel = template.flags['chris-premades'].sickeningRadiance?.[token.id]?.exhaustionLevel;
    if (exhaustionLevel === undefined) {
        let originalLevel = token.actor.system.attributes.exhaustion ?? 0;
        exhaustionLevel = originalLevel;
    }
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'sickeningRadiance');
    if (!effect) {
        let originItem = await fromUuid(template.flags.dnd5e?.origin);
        let effectData = {
            name: originItem?.name ?? templateUtils.getName(template),
            img: originItem.img ?? 'icons/magic/light/orb-beams-green.webp',
            origin: template.uuid,
            changes: [
                {
                    key: 'ATL.light.dim',
                    mode: 4,
                    value: 5,
                    priority: 20
                },
                {
                    key: 'system.traits.ci.value',
                    mode: 0,
                    value: 'invisible',
                    priority: 20
                }
            ],
            flags: {
                'chris-premades': {
                    sickeningRadiance: {
                        exhaustionLevel
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'effect', ['sickeningRadianceSickened']);
        effect = await effectUtils.createEffect(token.actor, effectData, {parentEntity: template, identifier: 'sickeningRadiance'});
    }
    let maxExhaustion = CONFIG.statusEffects.find(i => i?.id === 'exhaustion')?.levels ?? 6;
    if (exhaustionLevel >= maxExhaustion) return;
    await genericUtils.update(token.actor, {'system.attributes.exhaustion': exhaustionLevel + 1});
}
async function end({trigger: {entity: effect}}) {
    let actor = effect.parent;
    if (!actor) return;
    let origExhaustion = effect.flags['chris-premades'].sickeningRadiance.exhaustionLevel;
    await genericUtils.update(actor, {'system.attributes.exhaustion': origExhaustion});
}
export let sickeningRadiance = {
    name: 'Sickening Radiance',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let sickeningRadianceTemplate = {
    name: 'Sickening Radiance: Template',
    version: sickeningRadiance.version,
    template: [
        {
            pass: 'turnStart',
            macro: startOrEnter,
            priority: 50
        },
        {
            pass: 'enter',
            macro: startOrEnter,
            priority: 50
        }
    ]
};
export let sickeningRadianceSickened = {
    name: 'Sickening Radiance: Sickened',
    version: sickeningRadiance.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};