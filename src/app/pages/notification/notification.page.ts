import { Component, Injector, OnInit, Input } from '@angular/core';
import { BasePage } from '../base-page/base-page';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
})
export class NotificationPage extends BasePage implements OnInit {

  @Input() notification: any;

  public canShowMoreButton: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  enableMenuSwipe() {
    return false;
  }

  ngOnInit() {

    this.canShowMoreButton = this.notification.postId ||
      this.notification.placeId ||
      this.notification.categoryId;
  }

  onShowMoreButtonTouched() {
    this.modalCtrl.dismiss(this.notification);
  }

  onCloseButtonTouched() {
    this.modalCtrl.dismiss();
  }

}
