
import { Component, Injector, ViewChild } from '@angular/core';
import { Review } from '../../services/review-service';
import { BasePage } from '../base-page/base-page';
import { Place } from 'src/app/services/place-service';
import { IonContent } from '@ionic/angular';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.html',
  styleUrls: ['./review-list.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class ReviewListPage extends BasePage {

  @ViewChild(IonContent, { static: true }) container: IonContent;

  public reviews: Review[] = [];
  public params: any = {};
  public skeletonReviews: Array<any>;

  constructor(injector: Injector, private reviewService: Review) {
    super(injector);
    this.params = Object.assign({}, this.getParams());
    this.params.limit = 20;
    this.params.page = 0;
    this.skeletonReviews = Array(20);
  }

  enableMenuSwipe() {
    return false;
  }

  ngOnInit() { }

  async ionViewDidEnter() {

    try {

      this.showLoadingView({ showOverlay: false });

      if (this.params.id) {

        const place = new Place;
        place.id = this.params.id;
        this.params.place = place;
        await place.fetch();

        const str = await this.getTrans('REVIEWS');

        const title = this.params.place.title + ' - ' + str;
        this.setPageTitle(title);

        this.setMetaTags({
          title: title
        });
        this.loadData();

      } else {
        this.showEmptyView();
      }

    } catch {
      this.showErrorView();
    }


  }

  async loadData() {

    try {

      const reviews = await this.reviewService.load(this.params);

      for (let review of reviews) {
        this.reviews.push(review);
      }

      if (this.reviews.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

      this.onRefreshComplete(reviews);

    } catch (error) {

      this.showContentView();
      this.onRefreshComplete();

      let message = await this.getTrans('ERROR_NETWORK');
      this.showToast(message);
    }
  }

  onLoadMore(event: any = {}) {
    this.infiniteScroll = event.target;
    this.params.page++;
    this.loadData();
  }

  onReload(event: any = {}) {
    this.refresher = event.target;
    this.reviews = [];
    this.params.page = 0;
    this.loadData();
  }

}
