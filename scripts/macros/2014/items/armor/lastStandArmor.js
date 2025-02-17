import {actorUtils, constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validTypes = itemUtils.getConfig(workflow.item, 'creatureTypes');
    let validTargets = workflow.targets.filter(token => {
        if (!token.actor) return;
        let type = actorUtils.typeOrRace(token.actor);
        if (validTypes.includes(type)) return true;
    });
    genericUtils.updateTargets(validTargets);
}
async function use({trigger, workflow}) {
    let hideToken = itemUtils.getConfig(workflow.item, 'hideToken');
    let effectData = {
        name: workflow.item.name,
        img: 'icons/magic/unholy/orb-swirling-teal.webp',
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            }, 
            {
                key: 'system.attributes.ac.bonus',
                mode: 0,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 0,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'spectral-body',
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true
            }
        }
    };
    for (let token of workflow.failedSaves) {
        if (hideToken) await genericUtils.update(token.document, {hidden: true});
        await effectUtils.createEffect(token.actor, effectData);
    }
}
export let lastStandArmorBR = {
    name: 'Last Stand Armor, Breastplate',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'creatureTypes',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            type: 'select-many',
            default: ['celestial', 'fey', 'fiend'],
            options: constants.creatureTypeOptions,
            category: 'homebrew'
        },
        {
            value: 'hideToken',
            label: 'CHRISPREMADES.Config.HideToken',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};
export let lastStandArmorCM = {
    name: 'Last Stand Armor, Chain Mail',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorCS = {
    name: 'Last Stand Armor, Chain Shirt',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorHP = {
    name: 'Last Stand Armor, Half Plate',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorH = {
    name: 'Last Stand Armor, Hide',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorL = {
    name: 'Last Stand Armor, Leather',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorP = {
    name: 'Last Stand Armor, Padded',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorPl = {
    name: 'Last Stand Armor, Plate',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorRM = {
    name: 'Last Stand Armor, Ring Mail',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorSM = {
    name: 'Last Stand Armor, Scale Mail',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorS = {
    name: 'Last Stand Armor, Splint',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};
export let lastStandArmorSL = {
    name: 'Last Stand Armor, Studed Leather',
    version: lastStandArmorBR.version,
    midi: lastStandArmorBR.midi,
    config: lastStandArmorBR.config
};