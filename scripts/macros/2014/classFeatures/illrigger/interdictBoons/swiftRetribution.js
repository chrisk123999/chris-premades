import {dialogUtils, effectUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let balefulInterdictEffect = effectUtils.getAllEffectsByIdentifier(workflow.targets.first().actor, 'balefulInterdictEffect').find(effect => {
        let originItem = effectUtils.getOriginItemSync(effect);
        if (originItem.actor.id === workflow.actor.id) return true;
    });
    if (!balefulInterdictEffect) return;
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!validWeapons.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAWeapon', validWeapons, {sortAlphabetical: true});
    if (!selection) return;
    await workflowUtils.specialItemUse(selection, Array.from(workflow.targets), workflow.item, {consumeResources: true, consumeUsage: true});
}
export let interdictBoonSwiftRetribution = {
    name: 'Interdict Boons: Swift Retribution (Passive)',
    aliases: ['Interdict Boons: Swift Retribution'],
    version: '1.3.66',
    rules: 'legacy',
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