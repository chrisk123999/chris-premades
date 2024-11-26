import {Summons} from '../../../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let classLevel = workflow.actor.classes?.artificer?.system?.levels;
    if (!classLevel) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'eldritchCannon');
    if (effect && (classLevel < 15 || effect.flags['chris-premades']?.summons?.ids?.[effect.name]?.length > 1)) {
        genericUtils.notify('CHRISPREMADES.Macros.EldritchCannon.Maximum', 'info');
    }
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Eldritch Cannon');
    if (!sourceActor) return;
    let mendingData = await Summons.getSummonItem('Mending (Eldritch Cannon)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Mending', identifier: 'eldritchCannonMending'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'eldritchCannonDodge'});
    if (!mendingData || !dodgeData) return;
    let hpValue = classLevel * 5;
    async function cannonUpdates() {
        let cannonType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.EldritchCannon.SelectType', [
            ['CHRISPREMADES.Macros.EldritchCannon.Flamethrower', 'Flamethrower'],
            ['CHRISPREMADES.Macros.EldritchCannon.ForceBallista', 'ForceBallista'],
            ['CHRISPREMADES.Macros.EldritchCannon.Protector', 'Protector']
        ]);
        if (!cannonType) cannonType = 'Flamethrower';
        let cannonName = cannonType.split('B').join(' B');
        let cannonSize = await dialogUtils.buttonDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.EldritchCannon.Size', {cannonName}), [
            ['DND5E.SizeSmall', 'sm'],
            ['DND5E.SizeTiny', 'tiny']
        ]);
        if (!cannonSize) cannonSize = 'sm';
        let cannonItemData = await Summons.getSummonItem(cannonName, {}, workflow.item, {
            flatAttack: cannonType === 'ForceBallista', 
            damageBonus: cannonType === 'Protector' ? workflow.actor.system.abilities.int.mod : undefined, 
            flatDC: cannonType === 'Flamethrower', 
            translate: 'CHRISPREMADES.Macros.EldritchCannon.' + cannonType, 
            identifier: 'eldritchCannon' + cannonType
        });
        if (!cannonItemData) return;
        let camelCaseName = cannonType[0].toLowerCase() + cannonType.slice(1);
        let name = itemUtils.getConfig(workflow.item, camelCaseName + 'Name');
        if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Macros.EldritchCannon.Cannon') + ': ' + genericUtils.translate('CHRISPREMADES.Macros.EldritchCannon.' + cannonType);
        let updates = {
            actor: {
                name,
                system: {
                    details: {
                        cr: actorUtils.getLevelOrCR(workflow.actor)
                    },
                    attributes: {
                        hp: {
                            formula: hpValue,
                            max: hpValue,
                            value: hpValue
                        }
                    },
                    traits: {
                        size: cannonSize
                    }
                },
                prototypeToken: {
                    name,
                    disposition: workflow.token.document.disposition
                },
                items: [cannonItemData, mendingData, dodgeData]
            },
            token: {
                name,
                disposition: workflow.token.document.disposition,
                height: 1,
                width: 1,
                texture: {
                    scaleX: CONFIG.DND5E.actorSizes[cannonSize]?.token ?? CONFIG.DND5E.actorSizes[cannonSize]?.dynamicTokenScale,
                    scaleY: CONFIG.DND5E.actorSizes[cannonSize]?.token ?? CONFIG.DND5E.actorSizes[cannonSize]?.dynamicTokenScale
                }
            }
        };
        let avatarImg = itemUtils.getConfig(workflow.item, camelCaseName + 'Avatar');
        let tokenImg = itemUtils.getConfig(workflow.item, camelCaseName + 'Token');
        if (avatarImg) updates.actor.img = avatarImg;
        if (tokenImg) {
            genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
            genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
        }
        if (classLevel >= 9) {
            let explosiveCannonData = await Summons.getSummonItem('Explosive Cannon', {}, workflow.item, {flatDC: true, translate: 'CHRISPREMADES.Macros.EldritchCannon.ExplosiveCannon', identifier: 'eldritchCannonExplosiveCannon'});
            if (!explosiveCannonData) return;
            updates.actor.items.push(explosiveCannonData);
            let damageString = updates.actor.items[0].system.damage.parts[0][0];
            let newInteger = Number(damageString.charAt(0)) + 1;
            updates.actor.items[0].system.damage.parts[0][0] = newInteger + damageString.slice(1);
        }
        return updates;
    }
    let updates = [await cannonUpdates()];
    if (!updates?.length || !updates[0]) return;
    let sourceActors = [sourceActor];
    let costsSlotType;
    if (classLevel >= 15) {
        if (!effect) {
            let minSpellSlot = Object.entries(workflow.actor.system.spells).map(i => ({...i[1], type: i[0]})).filter(i => i.value > 0).reduce((lowest, curr) => curr.level < lowest.level ? curr : lowest, {level: 99});
            if (minSpellSlot.type) {
                let {level: slotLevel, value: slotValue, max: slotMax, type: slotType} = minSpellSlot;
                let dialogContent;
                if (slotType === 'pact') {
                    dialogContent = genericUtils.format('CHRISPREMADES.Macros.EldritchCannon.SpendPactAgain', {slotValue, slotMax});
                } else {
                    dialogContent = genericUtils.format('CHRISPREMADES.Macros.EldritchCannon.SpendSlotAgain', {slotLevel, slotValue, slotMax});
                } 
                let selection = await dialogUtils.confirm(workflow.item.name, dialogContent);
                if (selection) {
                    let newUpdates = await cannonUpdates();
                    if (newUpdates) {
                        updates.push(newUpdates);
                        costsSlotType = slotType;
                        sourceActors.push(sourceActor);
                    } 
                }
            }
        }
        let fortifiedPositionData = await Summons.getSummonItem('Fortified Position', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.EldritchCannon.FortifiedPosition', identifier: 'eldritchCannonFortifiedPosition'});
        if (!fortifiedPositionData) return;
        updates.forEach(update => update.actor.items.push(fortifiedPositionData));
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let commandFeatureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Eldritch Cannon: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.EldritchCannon.Command', identifier: 'eldritchCannonCommand'});
    if (!commandFeatureData) return;
    let dismissData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Eldritch Cannon: Dismiss', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.EldritchCannon.Dismiss', identifier: 'eldritchCannonDismiss'});
    if (!dismissData) return;
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        range: 5,
        animation,
        initiativeType: 'follows',
        dismissActivity: dismissData,
        additionalVaeButtons: [{type: 'use', name: commandFeatureData.name, identifier: 'eldritchCannonCommand'}]
    });
    if (costsSlotType) {
        let slotValue = workflow.actor.system.spells[costsSlotType].value;
        genericUtils.update(workflow.actor, {['system.spells.' + costsSlotType + '.value']: slotValue - 1});
    }
    if (!effect) effect = effectUtils.getEffectByIdentifier(workflow.actor, 'eldritchCannon');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [commandFeatureData, dismissData], {favorite: true, parentEntity: effect});
    let dismissItem = itemUtils.getItemByIdentifier(workflow.actor, genericUtils.getIdentifier(dismissData));
    if (!dismissItem) return;
    await effectUtils.addDependent(dismissItem, [effect]);
}
async function lateExplosiveCannon({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonedEffect');
    if (effect) await genericUtils.remove(effect);
}
async function early({workflow}) {
    if (workflow.item.system.uses.prompt && !workflow.item.system.uses.value) {
        let minSpellSlot = Object.entries(workflow.actor.system.spells).map(i => ({...i[1], type: i[0]})).filter(i => i.value > 0).reduce((lowest, curr) => curr.level < lowest.level ? curr : lowest, {level: 99});
        if (!minSpellSlot.type) {
            genericUtils.notify('CHRISPREMADES.Macros.EldritchCannon.NoSlots', 'info');
            return true;
        }
        let {level: slotLevel, value: slotValue, max: slotMax, type: slotType} = minSpellSlot;
        let dialogContent;
        if (slotType === 'pact') {
            dialogContent = genericUtils.format('CHRISPREMADES.Macros.EldritchCannon.SpendPact', {slotValue, slotMax});
        } else {
            dialogContent = genericUtils.format('CHRISPREMADES.Macros.EldritchCannon.SpendSlot', {slotLevel, slotValue, slotMax});
        } 
        let selection = await dialogUtils.confirm(workflow.item.name, dialogContent);
        if (!selection) return true;
        await genericUtils.update(workflow.actor, {['system.spells.' + slotType + '.value']: slotValue - 1});
        await genericUtils.update(workflow.item, {'system.uses.value': 1});
        workflow.options.configureDialog = false;
    }
}
async function lateForceBallista({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    await tokenUtils.pushToken(workflow.token, workflow.targets.first(), 5);
}
async function fortifiedPosition({workflow}) {
    if (workflow.targets.size !== 1 || !workflow.item || !constants.attacks.includes(workflow.item.system?.actionType)) return;
    let targetToken = workflow.targets.first();
    let coverBonus = tokenUtils.checkCover(workflow.token, targetToken, {item: workflow.item});
    if (coverBonus >= 2) return;
    let nearbyCannons = tokenUtils.findNearby(targetToken, 10, 'ally', {includeIncapacitated: false, includeToken: true}).filter(i => itemUtils.getItemByIdentifier(i.actor, 'eldritchCannonFortifiedPosition'));
    if (!nearbyCannons.length) return;
    await workflowUtils.bonusAttack(workflow, '-2');
}
export let eldritchCannon = {
    name: 'Create Eldritch Cannon',
    version: '0.12.29',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'flamethrowerName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Flamethrower',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'forceBallistaName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.ForceBallista',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'protectorName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Protector',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'flamethrowerToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Flamethrower',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'forceBallistaToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.ForceBallista',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'protectorToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Protector',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'flamethrowerAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Flamethrower',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'forceBallistaAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.ForceBallista',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'protectorAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.EldritchCannon.Protector',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ],
    ddbi: {
        removedItems: {
            'Eldritch Cannon': [
                'Eldritch Cannon: Flamethrower',
                'Eldritch Cannon: Force Ballista',
                'Eldritch Cannot: Protector'
            ]
        }
    }
};
export let eldritchCannonExplosiveCannon = {
    name: 'Eldritch Cannon: Explosive Cannon',
    version: eldritchCannon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: lateExplosiveCannon,
                priority: 50
            }
        ]
    }
};
export let eldritchCannonForceBallista = {
    name: 'Eldritch Cannon: Force Ballista',
    version: eldritchCannon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: lateForceBallista,
                priority: 50
            }
        ]
    }
};
export let eldritchCannonFortifiedPosition = {
    name: 'Eldritch Cannon: Fortified Position',
    version: eldritchCannon.version,
    midi: {
        actor: [
            {
                pass: 'scenePostAttackRoll',
                macro: fortifiedPosition,
                priority: 50
            },
            {
                pass: 'targetPostAttackRoll',
                macro: fortifiedPosition,
                priority: 50
            }
        ]
    }
};