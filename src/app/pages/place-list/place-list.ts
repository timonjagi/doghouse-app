
import { Component, ElementRef, HostListener, Injector, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { BasePage } from '../base-page/base-page';
import { AnimationController, Animation, IonContent, IonSearchbar, isPlatform, IonInput } from '@ionic/angular';
import { Place } from '../../services/place-service';
import { Category } from 'src/app/services/categories';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { FilterPlacePage } from '../filter-place/filter-place.page';
import { LocationAddress } from 'src/app/models/location-address';
import { LocationSelectPage } from '../location-select/location-select';
import Utils from 'src/app/utils';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';
import { Slide } from 'src/app/services/slider-image';
import Swiper, { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-place-list',
  templateUrl: './place-list.html',
  styleUrls: ['./place-list.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class PlaceListPage extends BasePage {

  @ViewChild(IonSearchbar, { static: true }) ionSearchBar: IonSearchbar;
  @ViewChild(IonContent, { static: true }) container: IonContent;
  @ViewChild('ionFabButton', { static: false, read: ElementRef }) ionFabButton: ElementRef;
  @ViewChild('txtSearchInput', { static: false }) txtSearchInput: IonInput;

  @HostListener('ionScroll', ['$event']) async onScroll($event: any) {

    const isScrollingDown = $event.detail.velocityY > 0;

    if (this.ionFabButton && isScrollingDown && !this.isIonFabHidden && !this.isAnimating) {

      this.isIonFabHidden = true;
      this.isAnimating = true;

      this.animation.direction('normal').play();
    }

  }

  @HostListener('ionScrollEnd') async onScrollEnd() {
    
    if (this.ionFabButton && this.isIonFabHidden && !this.isAnimating) {

      this.isIonFabHidden = false;
      this.isAnimating = true;

      this.animation.direction('reverse').play();
    }
  }

  public isIonFabHidden = false;
  public isAnimating: boolean;
  public animation: Animation;

  public params: any = {};
  public category: Category;
  public skeletonArray: any;
  public places: Place[] = [];
  public location: LocationAddress;

  public sortOptions: Array<any>;
  public selectedSortOption: any;

  public slidesTop: Slide[] = [];
  public slidesBottom: Slide[] = [];

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

  public swiperTop: Swiper;
  public swiperBottom: Swiper;

  constructor(injector: Injector,
    private geolocationService: GeolocationService,
    private animationCtrl: AnimationController,
    private slideService: Slide,
    private locationService: Location,
    private placeService: Place) {
    super(injector);
    this.skeletonArray = Array(24);
    this.params.limit = 20;
    this.params.page = 0;
    this.params.unit = this.preference.unit;
  }

  ngOnInit() {
    this.setupQueryParams();
    this.buildSortOptions();
  }

  buildSortOptions() {

    this.sortOptions = [{
      sortBy: 'desc', sortByField: 'createdAt',
    }, {
      sortBy: 'desc', sortByField: 'ratingAvg',
    }, {
      sortBy: 'asc', sortByField: 'location',
    }];

    const nearby = this.getQueryParams().nearby;

    if (this.params.sortBy && this.params.sortByField) {
      this.selectedSortOption = {
        sortBy: this.params.sortBy,
        sortByField: this.params.sortByField,
      };
    } else if (nearby === '1') {
      this.selectedSortOption = this.sortOptions[2];
    } else {
      this.selectedSortOption = this.sortOptions[0];
    }
  }

  onSortOptionTouched(event: any = {}) {

    const option = Object.assign({}, event.detail.value);
    delete option.id;

    this.params = {
      ...this.params,
      ...option
    };

    this.onReload();
    this.reloadUrl();
  }

  compareSortOption(o1: any, o2: any) {
    return o1 && o2 ? (o1.sortBy === o2.sortBy && o1.sortByField === o2.sortByField) : o1 === o2;
  };

  setupQueryParams() {

    const featured = this.getQueryParams().featured;
    
    if (featured === '1') {
      this.params.featured = featured;
    }

   const nearby = this.getQueryParams().nearby;

    if (nearby === '1') {
      this.params.nearby = nearby;
    }

    const cat = this.getQueryParams().cat;
    if (cat) {
      this.params.cat = cat;
    }

    const ratingMin = this.getQueryParams().ratingMin;
    if (ratingMin) {
      this.params.ratingMin = Number(ratingMin);
    }

    const ratingMax = this.getQueryParams().ratingMax;
    if (ratingMax) {
      this.params.ratingMax =  Number(ratingMax);
    }

    const maxDistance = this.getQueryParams().maxDistance;
    if (maxDistance) {
      this.params.maxDistance = Number(maxDistance);
    }

    let lat = this.getQueryParams().latitude;
    let lng = this.getQueryParams().longitude;

    if (lat && lng) {
      lat = Number(lat);
      lng = Number(lng);
      this.params.latitude = lat;
      this.params.longitude = lng;
    }

    const address = this.getQueryParams().address;

    if (address) {
      this.params.address = this.getQueryParams().address;
    }

    const sortBy = this.getQueryParams().sortBy;

    if (sortBy) {
      this.params.sortBy = sortBy;
    }

    const sortByField = this.getQueryParams().sortByField;

    if (sortByField) {
      this.params.sortByField = sortByField;
    }

  }

  onViewMapButtonTouched() {
    const params: any = this.getFilteredParams();
    this.navigateToRelative('./map', params);
  }

  async ionViewDidEnter() {

    this.setupAnimation();

    if (this.params.address) {
      this.updateSearchBarValue(this.params.address);
    }

    const title = await this.getTrans('PLACES');
    this.setPageTitle(title);

    this.setMetaTags({
      title: title
    });

    if (!this.places.length) {

      this.showLoadingView({ showOverlay: false });

      if (typeof this.params.cat === 'string') {
        this.category = new Category;
        this.category.id = this.params.cat;
        this.category.fetch();
      }

      this.onReload();
    }

    this.swiperTop?.autoplay.stop();
    this.swiperTop?.autoplay.start();
    this.swiperTop?.update();

    this.swiperBottom?.autoplay.stop();
    this.swiperBottom?.autoplay.start();
    this.swiperBottom?.update();
  }

  enableMenuSwipe() {
    return false;
  }

  setupAnimation() {
    this.animation = this.animationCtrl.create()
      .addElement(this.ionFabButton.nativeElement)
      .easing('ease-in-out')
      .onFinish(() => this.isAnimating = false)
      .duration(500)
      .keyframes([
        { offset: 0, opacity: '1', transform: 'translateY(0px)' },
        { offset: 1, opacity: '0', transform: 'translateY(200px)' }
      ])
  }

  async loadData() {

    try {

      const slides: Slide[] = await this.slideService.load({
        page: 'places',
      });

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

      const places = await this.placeService.load(this.params);

      for (let place of places) {
        this.places.push(place);
      }

      this.onRefreshComplete(places);

      if (this.places.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    } catch (err) {
      this.showContentView();
      this.onRefreshComplete();

      let message = await this.getTrans('ERROR_NETWORK');
      this.showToast(message);
    }
  }

  async onPresentFilterModal() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: FilterPlacePage,
      componentProps: { params: this.getFilteredParams() }
    });

    await modal.present();

    this.dismissLoadingView();

    const { data } = await modal.onDidDismiss();

    if (data) {

      const params = {
        ...this.params,
        ...data
      };

      this.params = params;

      this.showLoadingView({ showOverlay: false });
      this.onReload();
      this.reloadUrl();
    }
  }

  onLoadMore(event: any = {}) {
    this.infiniteScroll = event.target;
    this.params.page++;
    this.loadData();
  }

  async onReload(event: any = {}) {
    this.refresher = event.target;
    this.places = [];
    this.params.page = 0;

    if (this.params.latitude && this.params.longitude) {
      const location: LocationAddress = {
        address: this.params.address,
        latitude: this.params.latitude,
        longitude: this.params.longitude,
      };
      await this.geolocationService.setCurrentPosition(location)
    }

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

  reloadUrl() {
    const urlTree = this.createUrlTree(this.getFilteredParams());
    this.locationService.go(urlTree.toString());
  }

  getFilteredParams() {
    const params = Object.assign({}, this.params);

    const allowed = [
      'featured',
      'ratingMin',
      'ratingMax',
      'maxDistance',
      'latitude',
      'longitude',
      'cat',
      'address',
      'sortBy',
      'sortByField',
    ];

    return Object.keys(params)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {});
  }

  async updateSearchBarValue(val: string) {
    await Utils.sleep(800);
    this.ionSearchBar.value = val;
  }

  async onPresentLocationSelectModal() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: LocationSelectPage
    });

    await modal.present();

    this.dismissLoadingView();

    const { data } = await modal.onDidDismiss();

    if (data) {

      this.updateSearchBarValue(data.formatted_address);

      const location: LocationAddress = {
        address: data.formatted_address,
        latitude: data.geometry.location.lat(),
        longitude: data.geometry.location.lng(),
      };

      this.params.latitude = location.latitude;
      this.params.longitude = location.longitude;
      this.params.address = location.address;

      this.location = location;

      this.buildSortOptions();

      this.showLoadingView({ showOverlay: false });
      this.onReload();
      this.reloadUrl();
    }
  }

  onSubmitSearch(event: any) {
    if ((event.type === 'keyup' && event.key === 'Enter') || event.type === 'click') {
      this.navigateToRelative('../search', {
        q: this.txtSearchInput.value
      });
    }
  }

  onSlideTouched(slide: Slide) {

    if (slide.url && slide.type === 'url') {
      this.openUrl(slide.url);
    } else if (slide.place && slide.type === 'place') {
      this.navigateToRelative('../places/' + slide.place.id + '/' + slide.place.slug);
    } else if (slide.post && slide.type === 'post') {
      this.navigateToRelative('../posts/' + slide.post.id + '/' + slide.post.slug);
    } else if (slide.category && slide.type === 'category') {

      this.params.cat = slide.category.id;

      const urlTree = this.createUrlTree(this.getFilteredParams());
      this.locationService.go(urlTree.toString());
      window.location.reload();

    } else {
      // no match...
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
