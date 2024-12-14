import {activityUtils, genericUtils} from '../utils.js';
function flagAllRiders(item, updates) {
    let cprRiders = genericUtils.getProperty(item, 'flags.chris-premades.hiddenActivities') ?? [];
    cprRiders = cprRiders.map(i => activityUtils.getActivityByIdentifier(item, i)?.id).filter(i => i);
    // let currRiders = genericUtils.getProperty(item, 'flags.dnd5e.riders.activity') ?? [];
    let newRiders = genericUtils.getProperty(updates, 'flags.dnd5e.riders.activity') ?? [];
    let uniqueRiders = new Set([...newRiders, ...cprRiders]);
    genericUtils.setProperty(updates, 'flags.dnd5e.riders.activity', Array.from(uniqueRiders));
}
let alreadyEnabled = false;
function cssTweak() {
    if (alreadyEnabled) return;
    alreadyEnabled = true;
    let el = document.createElement('style');
    el.type = 'text/css';
    el.innerText = `
    .dnd5e2.application.activity {
        display: grid;
        grid-template-rows: 100px 1fr;
        grid-template-columns: 1fr;
        min-width: 900px;
        
        .sheet-tabs {
            display: none !important;
        }
        .hint {
            display: none !important;
        }
        .tab {
            display: inline-block;
            width: 100%;
            padding-bottom: 3px;
        }
        .window-content {
            display: grid;
            grid-template-rows: 1fr;
            grid-template-columns: [identity] 1fr [activation] 1fr [effect] 1fr;
        }
        .window-header {
            grid-column: 1 / 2;
        }
        .tab[data-tab="identity"] {
            grid-column: identity;
            grid-row: 1 / 2;
            nav.tabs {
                display: none !important;
            }
        }
        .tab[data-tab="activation"] {
            grid-column: activation;
            grid-row: 1 / 3;
            nav.tabs {
                display: none !important;
            }
        }
        .tab[data-tab="effect"] {
            grid-column: effect;
            grid-row: 1 / 3;
            nav.tabs {
                display: none !important;
            }
        }
        .tab[data-tab="midi-qol"] {
            grid-column: identity;
            grid-row: 2 / 3;
            nav.tabs {
                display: none !important;
            }
        }
    }`;
    document.head.appendChild(el);
}
export let activities = {
    flagAllRiders,
    cssTweak
};