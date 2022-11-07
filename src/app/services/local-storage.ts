import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LocationAddress } from '../models/location-address';

@Injectable({
  providedIn: 'root'
})
export class LocalStorage {

  private _storage: Storage | null = null;

  constructor(private storage: Storage) {}

  async init() {

    if (this._storage) {
      return this._storage;
    }

    const storage = await this.storage.create();
    this._storage = storage;

    return this._storage;
  }

  async setSkipIntroPage(val: boolean): Promise<any> {
    await this.init();
    return this._storage?.set('skipIntroPage', val);
  }

  async getSkipIntroPage(): Promise<any> {
    await this.init();
    return this._storage?.get('skipIntroPage');
  }

  async setUnit(val: string): Promise<any> {
    await this.init();
    return this._storage?.set('unit', val);
  }

  async getUnit(): Promise<any> {
    await this.init();
    return this._storage?.get('unit');
  }

  async setLang(val: string): Promise<any> {
    await this.init();
    return this._storage?.set('lang', val);
  }

  async getLang(): Promise<any> {
    await this.init();
    return this._storage?.get('lang');
  }

  async getIsPushEnabled(): Promise<boolean> {
    await this.init();
    return this._storage?.get('isPushEnabled');
  }

  async setIsPushEnabled(val: boolean) {
    await this.init();
    return this._storage?.set('isPushEnabled', val);
  }

  async getIsDarkModeEnabled(): Promise<boolean> {
    await this.init();
    return this._storage?.get('isDarkModeEnabled');
  }

  async setIsDarkModeEnabled(val: boolean) {
    await this.init();
    return this._storage?.set('isDarkModeEnabled', val);
  }

  async getLastPosition(): Promise<LocationAddress> {
    await this.init();
    return this._storage?.get('lastPosition');
  }

  async setLastPosition(val: LocationAddress) {
    await this.init();
    return this._storage?.set('lastPosition', val);
  }

  async setInstallationObjectId(val: string): Promise<string> {
    await this.init();
    return this._storage?.set('installationObjectId', val);
  }

  async getInstallationObjectId(): Promise<string> {
    await this.init();
    return this._storage?.get('installationObjectId');
  }

}
