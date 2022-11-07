
import { Component, Injector, NgZone } from '@angular/core';
import { LocalStorage } from '../../services/local-storage';
import { BasePage } from '../base-page/base-page';
import { SlideIntro } from 'src/app/services/slide-intro.service';
import Swiper from 'swiper';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-walkthrough',
  templateUrl: './walkthrough.html',
  styleUrls: ['./walkthrough.scss']
})
export class WalkthroughPage extends BasePage {

  public slides: SlideIntro[] = [];

  public swiper: Swiper;

  public isEnd: boolean;

  public isRequestingPush: boolean;
  public isRequestingLocation: boolean;

  public canRequestLocationPermission: boolean;
  public canRequestPushPermission: boolean;

  constructor(injector: Injector,
    private slideIntroService: SlideIntro,
    private zone: NgZone,
    private storage: LocalStorage) {
    super(injector);
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  ngOnInit() {
    this.showLoadingView({ showOverlay: false });
  }

  ionViewDidEnter() {
    this.loadData();
  }

  setSwiperInstance(swiper: Swiper) {
    this.swiper = swiper;
  }

  onSlideDidChange() {
    this.zone.run(() => this.isEnd = this.swiper.isEnd);
  }

  async onRequestLocationPermission() {

    try {
      this.isRequestingLocation = true;
      const status = await Geolocation.requestPermissions();

      if (status.location === 'granted') {
        this.skip();
      }

      this.isRequestingLocation = false;

    } catch {
      this.isRequestingLocation = false;
    }
  }

  async onRequestPushPermission() {

    try {
      this.isRequestingPush = true;

      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      }

      this.skip();

      this.isRequestingPush = false;
    } catch {
      this.isRequestingPush = false;
    }
  }

  async loadData() {

    try {
      const slides = await this.slideIntroService.load();

      const promptPermissionState: PermissionState = 'prompt';

      if (Capacitor.isNativePlatform()) {

        const statusGeolocation = await Geolocation.checkPermissions();
        this.canRequestLocationPermission = statusGeolocation.location === promptPermissionState;

        if (this.platform.is('ios')) {
          const statusPush = await PushNotifications.checkPermissions();
          this.canRequestPushPermission = statusPush.receive === promptPermissionState;
        }
      }

      const filteredSlides = slides.filter((slide: SlideIntro) => {
        return (
          (slide.permission === 'none') ||
          (slide.permission === 'location' && this.canRequestLocationPermission) ||
          (slide.permission === 'push' && this.canRequestPushPermission)
        )
      });

      this.slides = filteredSlides;

      if (this.slides && this.slides.length) {

        if (this.slides.length === 1) {
          this.isEnd = true;
        }

        this.showContentView();
      } else {
        this.modalCtrl.dismiss();
      }

    } catch {
      this.translate.get('ERROR_NETWORK')
        .subscribe(str => this.showToast(str));
      this.modalCtrl.dismiss();
    }
  }

  async skip() {

    if (this.isEnd) {

      try {
        await this.storage.setSkipIntroPage(true);
      } catch (error) {
        console.log(error.message);
      }

      this.modalCtrl.dismiss();

    } else {
      this.swiper.slideNext(500, true);
    }

  }

}
