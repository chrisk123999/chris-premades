import {Summons} from '../../lib/summons.js';
import {animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let jb2a = animationUtils.jb2aCheck();
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Spiritual Weapon');
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
        selectedImg = await Sequencer.Database.getEntry(selectedImg).file;
        return selectedImg;
    }
    if (!tokenImg && jb2a) {
        tokenImg = await selectTokenImg();
    }
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Spiritual Weapon: Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SpiritualWeapon.Attack', identifier: 'spiritualWeaponAttack'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let spellLevel = workflow.castData?.castLevel ?? 2;
    let numDice = Math.floor(spellLevel / 2);
    featureData.system.ability = workflow.item.system.ability;
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            numDice + 'd8[' + damageType + '] + @mod',
            damageType
        ]
    ];
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {duration: 60, range: 60, animation, initiativeType: 'none', additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'spiritualWeaponAttack'}]});
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: effect});
}
async function early({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'spiritualWeapon');
    if (!effect) return;
    let spiritualActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!spiritualActor) return;

    let effectData = {
        name: workflow.item.name,
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
    version: '0.12.2',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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
    ]
};
export let spiritualWeaponAttack = {
    name: 'Spiritual Weapon: Attack',
    version: spiritualWeapon.version,
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50
            }
        ]
    }
};