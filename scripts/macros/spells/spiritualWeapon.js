import {Summons} from '../../lib/summons.js';
import {activityUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let jb2a = animationUtils.jb2aCheck();
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Spiritual Weapon');
    if (!sourceActor) return;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name || !name.length) name = workflow.item.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
            }
        },
        token: {
            name
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    async function selectTokenImg() {
        let selection, selection2, selection3;
        let selectedImg = '';
        if (jb2a === 'patreon') {
            selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Style', [
                ['CHRISPREMADES.Macros.SpiritualWeapon.Flaming', 'flaming'],
                ['CHRISPREMADES.Macros.SpiritualWeapon.Dark', 'dark']
            ]);
            if (!selection) return;
            let validWeapons = [
                ['CHRISPREMADES.Macros.SpiritualWeapon.Sword', 'sword']
            ];
            let validColors = [
                ['CHRISPREMADES.Config.Colors.Blue', 'blue'],
                ['CHRISPREMADES.Config.Colors.Green', 'green'],
                ['CHRISPREMADES.Config.Colors.Red', 'red'],
                ['CHRISPREMADES.Config.Colors.Purple', 'purple']
            ];
            if (selection === 'flaming') {
                validWeapons.push(
                    ['CHRISPREMADES.Macros.SpiritualWeapon.Mace', 'mace'],
                    ['CHRISPREMADES.Macros.SpiritualWeapon.Maul', 'maul']
                );
                validColors.push(
                    ['CHRISPREMADES.Config.Colors.Yellow', 'yellow'],
                    ['CHRISPREMADES.Config.Colors.Orange', 'orange']
                );
            } else {
                validWeapons.push(
                    ['CHRISPREMADES.Macros.SpiritualWeapon.Scythe', 'scythe']
                );
                validColors.push(
                    ['CHRISPREMADES.Config.Colors.White', 'white']
                );
            }
            selection2 = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Weapon', validWeapons);
            if (!selection2) return;
            selection3 = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Color', validColors);
            if (!selection3) return;
            selectedImg = 'jb2a.spiritual_weapon.' + selection2 + '.' + selection + '.' + selection3;
        } else {
            selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Weapon', [
                ['CHRISPREMADES.Macros.SpiritualWeapon.Mace', 'mace'],
                ['CHRISPREMADES.Macros.SpiritualWeapon.Maul', 'maul']
            ]);
            if (!selection) return;
            let selection2 = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Color', [
                ['CHRISPREMADES.Config.Colors.Blue', 'spectral.blue'],
                ['CHRISPREMADES.Config.Colors.Yellow', 'flaming.yellow']
            ]);
            if (!selection2) return;
            selectedImg = 'jb2a.spiritual_weapon.' + selection + '.' + selection2;
        }
        selectedImg = Sequencer.Database.getEntry(selectedImg).file;
        return selectedImg;
    }
    if (!tokenImg && jb2a) {
        let defaultImg = workflow.item.flags['chris-premades']?.spiritualWeapon?.defaultImg;
        if (defaultImg && itemUtils.getConfig(workflow.item, 'useDefault')) {
            tokenImg = defaultImg;
        } else {
            tokenImg = await selectTokenImg();
            let saveDefault = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.SpiritualWeapon.SaveDefault');
            if (saveDefault) await genericUtils.setFlag(workflow.item, 'chris-premades', 'spiritualWeapon.defaultImg', tokenImg);
            await itemUtils.setConfig(workflow.item, 'useDefault', true);
        }
    }
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'spiritualWeaponAttack', {strict: true});
    if (!feature) return;
    let summonedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds, 
        range: 60, 
        animation, 
        initiativeType: 'none', 
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name,
            identifier: 'spiritualWeapon', 
            activityIdentifier: 'spiritualWeaponAttack'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['spiritualWeaponAttack'],
            favorite: true
        }
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'castData', workflow.castData);
    let summonedToken = summonedTokens?.[0];
    if (!summonedToken) return;
    let nearbyTargets = tokenUtils.findNearby(summonedToken, 5, 'any').filter(i => i.document.disposition !== workflow.token.document.disposition);
    if (!nearbyTargets.length) return;
    let target;
    if (nearbyTargets.length === 1) {
        target = nearbyTargets[0];
    } else {
        target = await dialogUtils.selectTargetDialog(feature.name, 'CHRISPREMADES.Macros.SpiritualWeapon.Select', nearbyTargets);
        if (!target?.length) return;
        target = target[0];
    }
    if (!target) return;
    feature.activation.type = 'special';
    await workflowUtils.syntheticActivityRoll(feature, [target]);
    feature.activation.type = 'bonus';
}
async function early({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
    if (workflow.activity.tempFlag) {
        workflow.activity.tempFlag = false;
        if (!effect) return;
        let spiritualActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
        if (!spiritualActor) return;
    
        let effectData = {
            name: workflow.activity.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'flags.midi-qol.rangeOverride.attack.all',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ],
            flags: {
                'chris-premades': {
                    effect: {
                        noAnimation: true
                    }
                }
            }
        };
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'spiritualWeaponAttack', parentEntity: effect});
        await effectUtils.createEffect(spiritualActor, effectData, {identifier: 'spiritualWeaponAttack', parentEntity: effect});
        return;
    }
    if (!effect) return true;
    workflow.activity.tempFlag = true;
    genericUtils.sleep(100).then(() => workflowUtils.syntheticActivityRoll(workflow.activity, Array.from(workflow.targets), {atLevel: effect.flags['chris-premades'].castData.castLevel}));
    return true;
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
    if (!effect) return;
    let spiritualActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!spiritualActor) return;
    let summonerEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeaponAttack');
    let summonedEffect = effectUtils.getEffectByIdentifier(spiritualActor, 'spiritualWeaponAttack');
    if (summonerEffect) await genericUtils.remove(summonerEffect);
    if (summonedEffect) await genericUtils.remove(summonedEffect);
}
export let spiritualWeapon = {
    name: 'Spiritual Weapon',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['spiritualWeapon']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['spiritualWeaponAttack']
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50,
                activities: ['spiritualWeaponAttack']
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SpiritualWeapon',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'force',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'useDefault',
            label: 'CHRISPREMADES.Macros.SpiritualWeapon.UseDefault',
            type: 'checkbox',
            default: false,
            category: 'animation'
        }
    ]
};