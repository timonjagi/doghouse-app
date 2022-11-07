import { Component, Injector, ViewChild } from '@angular/core';
import { IonContent, IonInput, isPlatform } from '@ionic/angular';
import { Slide } from 'src/app/services/slider-image';
import Swiper, { SwiperOptions } from 'swiper';
import { Category } from '../../services/categories';
import { BasePage } from '../base-page/base-page';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss'],
})
export class CategoryListPage extends BasePage {

  @ViewChild(IonContent, { static: true }) container: IonContent;
  @ViewChild('txtSearchInput', { static: false }) txtSearchInput: IonInput;

  public categories: Category[] = [];

  public pathPrefix: string;
  public currentUrl: string;

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
    private slideService: Slide,
    private categoryService: Category) {
    super(injector);
  }

  enableMenuSwipe() {
    return true;
  }

  ngOnInit() {

    const tab = this.activatedRoute.snapshot.parent.data.tab;

    if (tab === 'home') {
      this.pathPrefix = '../';
    } else if (tab === 'explore') {
      this.pathPrefix = './';
    }
  }

  ionViewWillEnter() {

    if (this.container) {
      this.container.scrollToTop();
    }
  }

  async ionViewDidEnter() {
    if (!this.categories.length) {
      this.showLoadingView({ showOverlay: false });
      this.loadData();
    }

    const title = await this.getTrans('EXPLORE');
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

  async loadData() {

    try {

      this.categories = await this.categoryService.load();

      const slides: Slide[] = await this.slideService.load({
        page: 'categories',
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
  
      if (this.categories.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }
  
      this.onRefreshComplete();

    } catch {
      this.showErrorView();
      this.onRefreshComplete();
    }
  }

  onReload(event: any = {}) {
    this.refresher = event.target;
    this.loadData();
  }

  onSubmitSearch(event: any) {
    if ((event.type === 'keyup' && event.key === 'Enter') || event.type === 'click') {
      this.navigateToRelative('./search', {
        q: this.txtSearchInput.value
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

  onSwiperTopInitialized(swiper: Swiper) {
    this.swiperTop = swiper;
    this.swiperTop.update();
  }

  onSwiperBottomInitialized(swiper: Swiper) {
    this.swiperBottom = swiper;
    this.swiperBottom.update();
  }

}
