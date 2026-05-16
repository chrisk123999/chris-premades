import {genericUtils} from '../utils.js';
export class CompendiumBrowser {
    static tabs = dnd5e.applications.CompendiumBrowser.TABS.reduce((obj, key) => {
        switch(key.tab) {
            case 'items':
                obj.allItemDocuments = key.tab;
                break;
            case 'physical': 
                obj.items = key.tab;
                break;
            default:
                obj[key.tab] = key.tab;
        }
        return obj;
    }, {});
    /** 
     * Provides a helper for using the dnd5e compendium browser with filters built in a way similar to dialog inputs
     * @param {string} tab Use one of CompendiumBrowser.tabs
     * @param {Array} filters Narrow the document choices available in the browser
     * [documentFieldKey, [valuesForField], optionsForThisField]
     * @param {hint, maxAmount, minAmount, getDocuments} options
         * @param {string} hint An optional tooltip shown above the list of documents
         * @param {number} maxAmount The most documents the user can select
         * @param {number} minAmount The fewest documents that must be selected
         * @param {boolean} getDocuments Function returns documents if true or compendium uuids if false
     */
    /**
     * Possible values for `filters`
     * Each filter may have these options:
     *     exclude: If true, sets and toggles with the provided values are excluded from the list. Defaults to false.
     *     locked: If true, the user can't change the filter setting. Defaults to false.
     * A small list of document fields have ui in the browser sidebar:
     * Document Type - certain documents have subtypes
     *     ['documentTypes', ['subtype'], {locked}]
     * Toggles - field is either present or not
     *     ['attunement', '', {exclude, locked}]
     * Sets - field can have many values
     *     ['rarity', ['_blank', 'common', 'uncommon'], {exclude, locked}]
     * Ranges - field can have a min or max value
     *     ['price', {max: 100, min: 0}, {locked}]
     * Any other fields can be filtered using 'arbitrary' and operators from dnd5e.Filter
     *     ['arbitrary', [{
     *         keyPath: 'system.identifier', 
     *         values: ['ball-bearings', 'basket', 'bedroll'], 
     *         operator: 'in'
     *     }]]
     */
    static async select(tab, filters=[], {hint, maxAmount=1, minAmount=0, getDocuments=true}={}) {
        let config = {
            selection: {
                min: minAmount,
                max: maxAmount
            },
            filters: {
                initial: {
                    additional: {},
                    arbitrary: []
                }, 
                locked: {
                    exclusive: true,
                    additional: {},
                    arbitrary: []
                }
            }
        };
        config.tab = tab in this.tabs ? this.tabs[tab] : tab;
        let tabData = dnd5e.applications.CompendiumBrowser.TABS.find(t => t.tab === config.tab);
        if (tabData) {
            config.filters.initial.documentClass = tabData.documentClass; 
            config.filters.initial.types = new Set(tabData.types);
        }
        if (hint) config.hint = genericUtils.translate(hint);
        for (let [type, values, options] of filters) {
            values = Array.isArray(values) ? values : [values];
            let lock = options?.locked ? 'locked' : 'initial';
            let filter = config.filters[lock];
            switch(type) {
                case 'documentTypes':
                    if (filter.types) values.forEach(v => filter.types.add(v));
                    else filter.types = new Set(values);
                    break;
                // toggles
                case 'attunement':
                case 'hasDarkVision':
                case 'hasSpellcasting':
                    filter.additional[type] = options?.exclude ? -1 : 1;
                    break;
                // sets
                case 'abilityScoreImprovement':
                case 'category':
                case 'habitat':
                case 'mastery':
                case 'movement':
                case 'properties':
                case 'rarity':
                case 'school':
                case 'size':
                case 'source':
                case 'subtype':
                case 'type':
                    filter.additional[type] = values.reduce((obj, key) => (obj[key] = options?.exclude ? -1 : 1, obj), filter.additional[type] ?? {});
                    break;
                // special case sets
                case 'class':
                case 'subclass':
                    filter.additional.spelllist = values.reduce((obj, key) => (obj[`${type}:${key}`] = options?.exclude ? -1 : 1, obj), filter.additional.spelllist ?? {});
                    break;
                // ranges
                case 'cr':
                case 'level':
                case 'price':
                    filter.additional[type] = {
                        max: values[0].max,
                        min: values[0].min
                    };
                    break;
                // custom arbitrary filters
                case 'compendium':
                    arbitrary({
                        v: values.map(v => ({k: 'uuid', v, o: 'contains'})),
                        o: 'OR'
                    });
                    break;
                case 'systemIdentifier':
                    arbitrary({
                        k: 'system.identifier',
                        v: new Set(values),
                        o: 'in'
                    });
                    break;
                // filter by any other data
                case 'arbitrary':
                    filter.arbitrary.push(...values.map(v => ({
                        k: v.keyPath,
                        v: new Set(v.values),
                        o: v.operator
                    })));
                    break;
            }
            function arbitrary(data) {
                if (options?.exclude) filter.arbitrary.push({v: data, o: 'NOT'});
                else filter.arbitrary.push(data);
            }
        }
        let choices = await dnd5e.applications.CompendiumBrowser.select(config);
        if (!choices?.size) return;
        if (!getDocuments) return Array.from(choices);
        let documents = await Promise.all(choices.map(p => fromUuid(p)));
        documents = documents.filter(i => !!i);
        return documents.length ? documents : undefined; 
    }
}
