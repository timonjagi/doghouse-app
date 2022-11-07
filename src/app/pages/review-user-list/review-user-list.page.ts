
import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { Review } from '../../services/review-service';
import { BasePage } from '../base-page/base-page';
import { IonContent } from '@ionic/angular';
import { User } from 'src/app/services/user-service';
import {
  trigger,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';

@Component({
  selector: 'app-review-user-list',
  templateUrl: './review-user-list.page.html',
  styleUrls: ['./review-user-list.page.scss'],
  animations: [
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', style({ opacity: 0, transform: `translate3d(0,10px,0)` }), { optional: true }),
        query(':enter', stagger('100ms', [animate('300ms', style({ opacity: 1, transform: `translate3d(0,0,0)` }))]), { optional: true })
      ])
    ])
  ]
})
export class ReviewUserListPage extends BasePage implements OnInit {

  @ViewChild(IonContent, { static: true }) container: IonContent;

  public reviews: Review[] = [];
  public params: any = {};
  public skeletonReviews: Array<any>;

  constructor(injector: Injector, private reviewService: Review) {
    super(injector);
  }

  enableMenuSwipe() {
    return false;
  }

  async ngOnInit() {

    this.params = Object.assign({}, this.getParams());
    this.params.limit = 20;
    this.params.page = 0;
    this.params.user = User.getCurrent();

    this.skeletonReviews = Array(24);

    const title = await this.getTrans('MY_REVIEWS');

    this.setPageTitle(title);

    this.setMetaTags({
      title: title
    });
  }

  async ionViewDidEnter() {

    if (!this.reviews.length) {
      this.showLoadingView({ showOverlay: false });
      this.loadData();
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
      
    } catch {

      this.showContentView();
      this.onRefreshComplete();

      this.translate.get('ERROR_NETWORK')
      .subscribe(str => this.showToast(str));
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
