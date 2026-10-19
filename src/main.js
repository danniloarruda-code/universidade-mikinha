import { registerSW } from 'virtual:pwa-register';
import './game.js';

// keeps the installed app up to date: a new version is fetched in the background and used on the next launch
registerSW({ immediate: true });

// the cloud sync loads after the game so the first screen appears right away
import('./cloud.js').catch(e => console.warn('Salvamento na nuvem indisponível:', e));
