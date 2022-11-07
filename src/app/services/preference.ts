import { Injectable } from '@angular/core';
import { LocationAddress } from '../models/location-address';

@Injectable({
  providedIn: 'root'
})
export class Preference {

  private _unit: string;
  private _currentTab: string;
  private _lang: string;
  private _isPushEnabled: boolean;
  private _location: LocationAddress;
  private _isDarkModeEnabled: boolean;
  private _isSubPage: boolean;

  get unit(): any {
    return this._unit;
  }

  set unit(val) {
    this._unit = val;
  }

  get lang(): any {
    return this._lang;
  }

  set lang(val) {
    this._lang = val;
  }

  get isPushEnabled(): boolean {
    return this._isPushEnabled;
  }

  set isPushEnabled(val) {
    this._isPushEnabled = val;
  }

  get isDarkModeEnabled(): boolean {
    return this._isDarkModeEnabled;
  }

  set isDarkModeEnabled(val) {
    this._isDarkModeEnabled = val;
  }

  get location(): LocationAddress {
    return this._location;
  }

  set location(val) {
    this._location = val;
  }

  get currentTab(): string {
    return this._currentTab;
  }

  set currentTab(val) {
    this._currentTab = val;
  }

  get isSubPage(): boolean {
    return this._isSubPage;
  }

  set isSubPage(val) {
    this._isSubPage = val;
  }

}
