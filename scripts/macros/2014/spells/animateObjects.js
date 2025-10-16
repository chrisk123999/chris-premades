import {Summons} from '../../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let totalSummons = Math.floor(10 + ((workflow.spellLevel - 5) * 2));
    let tinyObject = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object - Tiny');
    if (!tinyObject) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let smallObject = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object - Small');
    if (!smallObject) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let mediumObject = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object - Medium');
    if (!mediumObject) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let largeObject = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object - Large');
    if (!largeObject) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let hugeObject = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object - Huge');
    if (!hugeObject) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let compendiumDocs = [
        {
            name: 'Tiny (1 Object)',
            img: itemUtils.getConfig(workflow.item, 'token1'),
            id: 'tiny'
        },
        {
            name: 'Small (1 Object)',
            img: itemUtils.getConfig(workflow.item, 'token2'),
            id: 'small'
        },
        {
            name: 'Medium (2 Object)',
            img: itemUtils.getConfig(workflow.item, 'token3'),
            id: 'medium'
        },
        {
            name: 'Large (4 Object)',
            img: itemUtils.getConfig(workflow.item, 'token4'),
            id: 'large'
        },
        {
            name: 'Huge (8 Object)',
            img: itemUtils.getConfig(workflow.item, 'token5'),
            id: 'huge'
        }
    ];
    let objectWeights = {
      tiny: 1,
      small: 1,
      medium: 2,
      large: 4,
      huge: 8
    };
    let userId = game.userId;
    if (!userId) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let sourceDocs = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons: totalSummons}), compendiumDocs, {max: totalSummons, weights: objectWeights});
    if (sourceDocs?.length) sourceDocs = sourceDocs?.filter(i => i.amount);
    if (!sourceDocs?.length) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let sourceActors1 = await Promise.all(sourceDocs.map(async i => {
        if (i.document.id === 'tiny') {
            return {
                document: tinyObject,
                amount: i.amount};
        }
    }));
    sourceActors1 = sourceActors1.filter(item => item !== undefined);
    let sourceActors2 = await Promise.all(sourceDocs.map(async i => {
        if (i.document.id === 'small') {
            return {
                document: smallObject,
                amount: i.amount};
        }
    }));
    sourceActors2 = sourceActors2.filter(item => item !== undefined);
    let sourceActors3 = await Promise.all(sourceDocs.map(async i => {
        if (i.document.id === 'medium') {
            return {
                document: mediumObject,
                amount: i.amount};
        }
    }));
    sourceActors3 = sourceActors3.filter(item => item !== undefined);
    let sourceActors4 = await Promise.all(sourceDocs.map(async i => {
        if (i.document.id === 'large') {
            return {
                document: largeObject,
                amount: i.amount};
        }
    }));
    sourceActors4 = sourceActors4.filter(item => item !== undefined);
    let sourceActors5 = await Promise.all(sourceDocs.map(async i => {
        if (i.document.id === 'huge') {
            return {
                document: hugeObject,
                amount: i.amount};
        }
    }));
    sourceActors5 = sourceActors5.filter(item => item !== undefined);
    if (sourceActors1?.length) await animateGroup(sourceActors1, workflow.item, workflow.token, 1);
    if (sourceActors2?.length) await animateGroup(sourceActors2, workflow.item, workflow.token, 2);
    if (sourceActors3?.length) await animateGroup(sourceActors3, workflow.item, workflow.token, 3);
    if (sourceActors4?.length) await animateGroup(sourceActors4, workflow.item, workflow.token, 4);
    if (sourceActors5?.length) await animateGroup(sourceActors5, workflow.item, workflow.token, 5);
}
async function animateGroup(actorGroup, item, token, size) {
    let name;
    let avatarImg;
    let tokenImg;
    switch (size) {
      case 1:
        name = itemUtils.getConfig(item, 'name1');
        avatarImg = itemUtils.getConfig(item, 'avatar1');
        tokenImg = itemUtils.getConfig(item, 'token1');
        break;
      case 2:
        name = itemUtils.getConfig(item, 'name2');
        avatarImg = itemUtils.getConfig(item, 'avatar2');
        tokenImg = itemUtils.getConfig(item, 'token2');
        break;
      case 3:
        name = itemUtils.getConfig(item, 'name3');
        avatarImg = itemUtils.getConfig(item, 'avatar3');
        tokenImg = itemUtils.getConfig(item, 'token3');
        break;
      case 4:
        name = itemUtils.getConfig(item, 'name4');
        avatarImg = itemUtils.getConfig(item, 'avatar4');
        tokenImg = itemUtils.getConfig(item, 'token4');
        break;
      case 5:
        name = itemUtils.getConfig(item, 'name5');
        avatarImg = itemUtils.getConfig(item, 'avatar5');
        tokenImg = itemUtils.getConfig(item, 'token5');
        break;
    }
    if (!name?.length) name = 'Animated Object';
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name,
                disposition: token.document.disposition
            }
        },
        token: {
            name,
            disposition: token.document.disposition
        }
    };
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(item, 'animation') ?? 'none';
    let initType = itemUtils.getConfig(item, 'initiativeType') ?? 'follows';
    await Summons.spawn(actorGroup, updates, item, token, {
        duration: 60,
        range: 120,
        animation,
        initiativeType: initType
    });
}
export let animateObjects = {
    name: 'Animate Objects',
    version: '1.0.0',
    rules: 'legacy',
    hasAnimation: true,
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
            value: 'initiativeType',
            label: 'Initiative Type',
            type: 'select',
            default: 'follows',
            category: 'mechanics',
            options: [
              {
                value: 'follows',
                label: "Follows"
              },
              {
                value: 'separate',
                label: "Separate"
              }
            ]
        },
        {
            value: 'name1',
            label: "Custom Name - T",
            type: 'text',
            default: 'Animated Object',
            category: 'summons'
        },
        {
            value: 'token1',
            label: "Custom Token - T",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'avatar1',
            label: "Custom Avatar - T",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'name2',
            label: "Custom Name - S",
            type: 'text',
            default: 'Animated Object',
            category: 'summons'
        },
        {
            value: 'token2',
            label: "Custom Token - S",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'avatar2',
            label: "Custom Avatar - S",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'name3',
            label: "Custom Name - M",
            type: 'text',
            default: 'Animated Object',
            category: 'summons'
        },
        {
            value: 'token3',
            label: "Custom Token - M",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'avatar3',
            label: "Custom Avatar - M",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'name4',
            label: "Custom Name - L",
            type: 'text',
            default: 'Animated Object',
            category: 'summons'
        },
        {
            value: 'token4',
            label: "Custom Token - L",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'avatar4',
            label: "Custom Avatar - L",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'name5',
            label: "Custom Name - H",
            type: 'text',
            default: 'Animated Object',
            category: 'summons'
        },
        {
            value: 'token5',
            label: "Custom Token - H",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
        {
            value: 'avatar5',
            label: "Custom Avatar - H",
            type: 'file',
            default: 'https://assets.forge-vtt.com/bazaar/core/icons/svg/mystery-man.svg',
            category: 'summons'
        },
    ]
};