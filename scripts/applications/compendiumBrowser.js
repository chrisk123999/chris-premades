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
                // filter by any other data
                case 'arbitrary':
                    console.log('ARB', {type, values, options, mapped: values.map(v => ({
                        k: v.keyPath,
                        v: new Set(v.values),
                        o: v.operator
                    }))});
                    filter.arbitrary.push(...values.map(v => ({
                        k: v.keyPath,
                        v: new Set(v.values),
                        o: v.operator
                    })));
                    break;
            }
        }
        let choices = await dnd5e.applications.CompendiumBrowser.select(config);
        if (!choices?.size) return;
        if (!getDocuments) return Array.from(choices);
        let documents = await Promise.allSettled(choices.map(p => fromUuid(p)));
        documents = documents.map(r => r?.value).filter(i => !!i);
        return documents.length ? documents : undefined; 
    }
}
