import {compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let spellId = itemUtils.getConfig(workflow.item, 'id');
    if (spellId?.length) return;
    let validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.uses.max === 1 && ['atwill', 'innate'].includes(i.system.preparation?.mode) && i.system.uses.per === 'sr');
    if (!validSpells?.length) {
        genericUtils.notify('CHRISPREMADES.Macros.AberrantDragonmark.NoValid', 'info');
        return;
    }
    let selectedSpell = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.AberrantDragonmark.Select', validSpells);
    if (!selectedSpell) return;
    await itemUtils.setConfig(workflow.item, 'id', selectedSpell.id);
}
async function late({trigger: {entity: item}, workflow}) {
    let aberrantId = itemUtils.getConfig(item, 'id');
    if (!aberrantId?.length || workflow.item.id !== aberrantId) return;
    let hdSelection = await dialogUtils.selectHitDie(workflow.actor, item.name, 'CHRISPREMADES.Macros.AberrantDragonmark.Expend');
    if (!hdSelection) return;
    hdSelection = hdSelection.find(i => i.amount)?.document;
    if (!hdSelection) return;
    await genericUtils.update(hdSelection, {'system.hitDiceUsed': hdSelection.system.hitDiceUsed + 1});
    let die = await new Roll(hdSelection.system.hitDice).evaluate();
    die.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: item.name
    });
    let isDamage = die.total % 2;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.featFeatures, 'Aberrant Dragonmark: Damage', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.AberrantDragonmark.' + (isDamage ? 'Damage' : 'Healing')});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0] = [
        die.total + (isDamage ? '[force]' : '[temphp]'),
        isDamage ? 'force' : 'temphp'
    ];
    let targetToken = workflow.token;
    if (isDamage) {
        let nearbyTargets = tokenUtils.findNearby(workflow.token, 30, 'any');
        if (nearbyTargets.length) {
            targetToken = nearbyTargets[Math.floor((Math.random() * nearbyTargets.length))];
        }
    }
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [targetToken]);
}
export let aberrantDragonmark = {
    name: 'Aberrant Dragonmark',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'id',
            label: 'CHRISPREMADES.Macros.AberrantDragonmark.ConfigId',
            type: 'text',
            default: '',
            category: 'mechanics'
        }
    ],
    ddbi: {
        removeChoices: [
            'Aberrant Dragonmark'
        ],
        additionalItems: {
            'Aberrant Dragonmark': [
                'Aberrant Dragonmark'
            ]
        }
    }
};