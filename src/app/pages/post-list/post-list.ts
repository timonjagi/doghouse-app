import { Component, Injector, ViewChild } from '@angular/core';
import { IonContent, isPlatform } from '@ionic/angular';
import { BasePage } from '../base-page/base-page';
import { Post } from '../../services/post';
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
  selector: 'app-post-list',
  templateUrl: './post-list.html',
  styleUrls: ['./post-list.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class PostListPage extends BasePage {

  @ViewChild(IonContent, { static: true }) container: IonContent;

  protected params: any = {};

  public skeletonArray: any;
  public posts: Post[] = [];

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
    private postService: Post) {
    super(injector);
    this.skeletonArray = Array(20);
    this.params.limit = 20;
    this.params.page = 0;
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  ngOnInit() { }

  ionViewWillEnter() {
    if (this.container) {
      this.container.scrollToTop();
    }
  }

  async ionViewDidEnter() {
    if (!this.posts.length) {
      this.showLoadingView({ showOverlay: false });
      this.loadData();
    }
    const title = await this.getTrans('POSTS');
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

      const slides: Slide[] = await this.slideService.load({
        page: 'posts',
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

      const posts = await this.postService.load(this.params);

      for (let post of posts) {
        this.posts.push(post);
      }

      if (this.posts.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

      this.onRefreshComplete(posts);

    } catch (err) {
      this.translate.get('ERROR_NETWORK')
        .subscribe(str => this.showToast(str));
      this.showContentView();
      this.onRefreshComplete();
    }
  }

  onReload(event: any = {}) {
    this.refresher = event.target;
    this.posts = [];
    this.params.page = 0;
    this.loadData();
  }

  onLoadMore(event: any = {}) {
    this.infiniteScroll = event.target;
    this.params.page++;
    this.loadData();
  }

  onSlideTouched(slide: Slide) {

    if (slide.url && slide.type === 'url') {
      this.openUrl(slide.url);
    } else if (slide.place && slide.type === 'place') {
      this.navigateToRelative('./places/' + slide.place.id + '/' + slide.place.slug);
    } else if (slide.post && slide.type === 'post') {
      this.navigateToRelative('./' + slide.post.id + '/' + slide.post.slug);
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
