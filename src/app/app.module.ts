import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy, isPlatform } from '@ionic/angular';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons/faFacebookF';
import { faTwitter } from '@fortawesome/free-brands-svg-icons/faTwitter';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';

const icons = [faFacebookF, faTwitter, faWhatsapp];
library.add(...icons);

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { IonicStorageModule } from '@ionic/storage-angular';
import { ImgFallbackModule } from 'ngx-img-fallback';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { NgxStripeModule } from 'ngx-stripe';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import localeAr from '@angular/common/locales/ar';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeAr);
registerLocaleData(localeEs);

import SwiperCore, { Pagination, Navigation, Autoplay } from 'swiper';
import { IonicSwiper } from '@ionic/angular';
import { EmptyViewModule } from './components/empty-view/empty-view.module';
import { NotificationPageModule } from './pages/notification/notification.module';

SwiperCore.use([IonicSwiper, Pagination, Navigation, Autoplay]);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    IonicModule.forRoot({
      backButtonText: '',
      animated: !isPlatform('mobileweb') && !isPlatform('desktop'),
      rippleEffect: !isPlatform('mobileweb') && !isPlatform('desktop'),
    }),
    AppRoutingModule,
    ImgFallbackModule,
    EmptyViewModule,
    NotificationPageModule,
    NgxStripeModule.forRoot(),
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production && !isPlatform('capacitor'),
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
