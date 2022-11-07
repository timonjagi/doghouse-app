import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService extends Parse.Object {

  constructor() {
    super('AppConfig');
  }

  load(): Promise<AppConfigService> {
    return Parse.Cloud.run('getAppConfig');
  }

  get about(): any {
    return this.get('about');
  }

  get reviews(): any {
    return this.get('reviews');
  }

  get slides(): any {
    return this.get('slides');
  }

  get places(): any {
    return this.get('places');
  }

  get auth(): any {
    return this.get('auth');
  }

  get stripePublicKey(): any {
    return this.get('stripePublicKey');
  }
}

Parse.Object.registerSubclass('AppConfig', AppConfigService);