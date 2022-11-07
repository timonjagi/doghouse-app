import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { defineCustomElements as defineIonicPwaElements } from '@ionic/pwa-elements/loader';
import { defineCustomElements as defineWebSocialShare } from 'web-social-share/dist/loader';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

// Call the element loader after the platform has been bootstrapped
defineIonicPwaElements();
defineWebSocialShare();
