import { Component, Injector, ViewChild } from '@angular/core';
import { IonContent, IonInput, isPlatform } from '@ionic/angular';
import { BasePage } from '../base-page/base-page';
import * as Parse from 'parse';
import { Category } from '../../services/categories';
import { Place } from '../../services/place-service';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { Slide } from 'src/app/services/slider-image';
import { LocationSelectPage } from '../location-select/location-select';
import { LocalStorage } from 'src/app/services/local-storage';
import { LocationAddress } from 'src/app/models/location-address';
import { WalkthroughPage } from '../walkthrough/walkthrough';
import { AppConfigService } from 'src/app/services/app-config.service';
import Swiper, { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomePage extends BasePage {

  @ViewChild(IonContent, { static: true }) container: IonContent;

  @ViewChild('txtSearchInput', { static: false }) txtSearchInput: IonInput;

  public slidesTop: Slide[] = [];
  public slidesBottom: Slide[] = [];

  public featuredPlaces: Place[] = [];
  public newPlaces: Place[] = [];
  public nearbyPlaces: Place[] = [];

  public categories: Category[] = [];

  public params: any = {};

  public slideTopOpts: SwiperOptions = {
    pagination: false,
    navigation: false,
    autoplay: { delay: 4000, disableOnInteraction: false },
  };

  public slideBottomOpts: SwiperOptions = {
    pagination: false,
    navigation: false,
    autoplay: { delay: 4000, disableOnInteraction: false },
  };

  public skeletonArray: any[];

  public location: any;

  public swiperTop: Swiper;
  public swiperBottom: Swiper;

  constructor(injector: Injector,
    private localStorage: LocalStorage,
    private geolocationService: GeolocationService,
    private appConfigService: AppConfigService) {
    super(injector);
    this.skeletonArray = Array(6);
    this.params.unit = this.preference.unit;
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  async ionViewDidEnter() {
    const title = await this.getTrans('HOME');
    this.setPageTitle(title);

    this.setMetaTags({
      title: title
    });

    this.swiperTop?.autoplay.stop();
    this.swiperTop?.autoplay.start();
    this.swiperTop?.update();

    this.swiperBottom?.autoplay.stop();
    this.swiperBottom?.autoplay.start();
    this.swiperBottom?.update();
  }

  ionViewWillEnter() {
    this.container?.scrollToTop();
  }

  async ngOnInit() {

    try {

      this.showLoadingView({ showOverlay: false });

      const appConfig = await this.appConfigService.load();

      if (appConfig && appConfig.slides && appConfig.slides.disabled) {
        this.onReload();
        return;
      }

      const skipIntro = await this.localStorage.getSkipIntroPage();

      if (!skipIntro) {
        const modal = await this.modalCtrl.create({
          component: WalkthroughPage
        });

        await modal.present();

        await modal.onDidDismiss();
      }

      this.onReload();

    } catch {
      this.showErrorView();
    }

  }


  async onReload(event: any = {}) {
    this.refresher = event.target;
    this.showLoadingView({ showOverlay: false });

    const location = await this.geolocationService.getCurrentPosition();

    if (!location) {
      this.onRefreshComplete();
      return this.showErrorView();
    }

    this.location = location;
    this.params.latitude = location.latitude;
    this.params.longitude = location.longitude;
    this.params.address = location.address;

    this.loadData();
  }

  onLogoTouched() {
    this.container.scrollToTop(300);
  }

  async loadData() {

    try {

      const data: any = await Parse.Cloud.run('getHomePageData', this.params);

      this.newPlaces = data.newPlaces || [];
      this.featuredPlaces = data.featuredPlaces || [];
      this.nearbyPlaces = data.nearbyPlaces || [];
      this.categories = data.categories || [];
      
      const slides: Slide[] = data.slides || [];

      this.slidesTop = slides.filter(slide => slide.position === 'top');
      this.slidesBottom = slides.filter(slide => slide.position === 'bottom');

      if (this.slidesTop.length > 1) {
        this.slideTopOpts.pagination = true;
        this.slideTopOpts.navigation = isPlatform('desktop');
      }

      if (this.slidesBottom.length > 1) {
        this.slideBottomOpts.pagination = true;
        this.slideBottomOpts.navigation = isPlatform('desktop');
      }

      this.onRefreshComplete();
      this.showContentView();

    } catch {

      this.showErrorView();
      this.onRefreshComplete();
      this.translate.get('ERROR_NETWORK')
        .subscribe(str => this.showToast(str));
    }

  }

  onPlaceTouched(place: Place) {
    this.navigateToRelative('./places/' + place.id + '/' + place.slug);
  }

  async onPresentLocationSelectModal() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: LocationSelectPage,
    });

    await modal.present();

    this.dismissLoadingView();

    const { data } = await modal.onDidDismiss();

    if (data) {

      const location: LocationAddress = {
        address: data.formatted_address,
        latitude: data.geometry.location.lat(),
        longitude: data.geometry.location.lng(),
      };

      this.navigateToRelative('./places', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });
    }
  }

  onSlideTouched(slide: Slide) {

    if (slide.url && slide.type === 'url') {
      this.openUrl(slide.url);
    } else if (slide.place && slide.type === 'place') {
      this.navigateToRelative('./places/' + slide.place.id + '/' + slide.place.slug);
    } else if (slide.post && slide.type === 'post') {
      this.navigateToRelative('./posts/' + slide.post.id + '/' + slide.post.slug);
    } else if (slide.category && slide.type === 'category') {
      this.navigateToRelative('./places', {
        cat: slide.category.id
      });
    } else {
      // no match...
    }
  }

  onSubmitSearch(event: any) {
    if ((event.type === 'keyup' && event.key === 'Enter') || event.type === 'click') { 
      this.navigateToRelative('./search', {
        q: this.txtSearchInput.value
      });
    }
  }

  onSwiperTopInitialized(swiper: Swiper) {
    this.swiperTop = swiper;
    this.swiperTop.update();
  }

  onSwiperBottomInitialized(swiper: Swiper) {
    this.swiperBottom = swiper;
    this.swiperBottom.update();
  }

}
