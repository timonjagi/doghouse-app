import { Injectable } from '@angular/core';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';
import { Platform } from "@ionic/angular";
import * as Parse from 'parse';
import { LocalStorage } from './local-storage';
import { LocationAddress } from '../models/location-address';
import { GeocoderService } from './geocoder.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  private lastPosition: LocationAddress;

  constructor(
    private platform: Platform,
    private geocoderService: GeocoderService,
    private storage: LocalStorage) { }

  setCurrentPosition(location: LocationAddress): Promise<LocationAddress> {
    this.lastPosition = location;

    const point = this.toParseGeoPoint(location);

    window.dispatchEvent(new CustomEvent('installation:update', {
      detail: { location: point }
    }));

    return this.storage.setLastPosition(location);
  }

  async getCurrentPosition(): Promise<LocationAddress> {

    if (!this.lastPosition) {
      try {
        const savedPosition = await this.storage.getLastPosition();

        if (savedPosition) {
          this.lastPosition = savedPosition;
        }

      } catch (error) {
        console.warn(error);
      }
    }

    if (this.lastPosition) {
      return this.lastPosition;
    }

    let isGranted = true;

    if (this.platform.is('capacitor')) {

      const permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        const status = await Geolocation.requestPermissions();

        isGranted = status.location === 'granted';

      } else {
        isGranted = true;
      }
    }

    let locationAddress: LocationAddress = null;

    if (isGranted) {
      
      try {

        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        };

        const { coords } = await Geolocation.getCurrentPosition(options);

        locationAddress = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

      } catch (error) {
        console.log(error);
      }
    }

    if (locationAddress === null) {

      try {
        const res = await this.geocoderService.ipToGeo();
        locationAddress = {
          latitude: Number(res.latitude),
          longitude: Number(res.longitude),
        }
      } catch (error) {
        return null;
      }

    }

    try {

      const data = await this.geocoderService.reverse({
        lat: locationAddress.latitude,
        lng: locationAddress.longitude,
      });

      let address = '';

      if (data.results && data.results.length) {
        address = data.results[0].formatted_address;
      }

      locationAddress.address = address;
      this.lastPosition = locationAddress;
      this.storage.setLastPosition(this.lastPosition);

    } catch (error) {
      return null;
    }

    const point = this.toParseGeoPoint(locationAddress);

    window.dispatchEvent(new CustomEvent('installation:update', {
      detail: { location: point }
    }));

    return this.lastPosition;

  }

  toParseGeoPoint(coords: any): Parse.GeoPoint {
    return new Parse.GeoPoint(coords.latitude, coords.longitude);
  }
}
