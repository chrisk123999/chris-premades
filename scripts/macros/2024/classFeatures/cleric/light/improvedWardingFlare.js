import {genericUtils, itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item, actor}}) {
    let wardingFlare = itemUtils.getItemByIdentifier(actor, 'wardingFlare');
    if (!wardingFlare) return;
    if (!wardingFlare.system.uses.recovery.find(i => i.period === 'sr')) {
        let itemData = genericUtils.duplicate(wardingFlare.toObject());
        itemData.system.uses.recovery.push({
            formula: undefined,
            period: 'sr',
            type: 'recoverAll'
        });
        await genericUtils.update(wardingFlare, {'system.uses.recovery': itemData.system.uses.recovery});
    }
}
export let improvedWardingFlare = {
    name: 'Improved Warding Flare',
    version: '1.3.10',
    rules: 'modern',
    item: [
        {
            pass: 'created',
            macro: added
        }
    ]
};