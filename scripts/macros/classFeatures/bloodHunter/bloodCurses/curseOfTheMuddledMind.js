import {dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let bloodMaledict = itemUtils.getItemByIdentifier(workflow.actor, 'bloodMaledict');
    if (!bloodMaledict?.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Generic.NoMoreResource', 'info');
    }
    let amplify = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.BloodCurses.Amplify');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.concentration',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true,
                specialDuration: ['turnEndSource', 'combatEnd']
            }
        }
    };
    if (!amplify) {
        effectData.flags.dae.specialDuration.push('isSave');
    } else {
        let damageDice = workflow.actor.system.scale?.['blood-hunter']?.['crimson-rite'];
        if (!damageDice) {
            genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: 'crimson-rite'}), 'warn');
            workflow.aborted = true;
            return;
        }
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'curseOfBinding.amplify', true);
        let damageRoll = await new CONFIG.Dice.DamageRoll(damageDice + '[necrotic]', {}, {type: 'necrotic'}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: workflow.item.name
        });
        await workflowUtils.applyDamage([workflow.token], damageRoll.total, 'none');
    }
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
export let curseOfTheMuddledMind = {
    name: 'Blood Curse of the Muddled Mind',
    version: '0.12.64',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Blood Curse of the Muddled Mind': [
                'Blood Curses: Blood Curse of the Muddled Mind'
            ]
        }
    }
};