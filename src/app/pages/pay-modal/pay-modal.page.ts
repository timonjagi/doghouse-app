import { Component, Input, Injector, OnInit, ViewChild, HostListener } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import {
  StripeFactoryService,
  StripeInstance,
  StripePaymentElementComponent
} from 'ngx-stripe';
import {
  StripeElementsOptions,
  PaymentIntent,
} from '@stripe/stripe-js';

import { UserPackage } from 'src/app/services/user-package';
import { Place } from 'src/app/services/place-service';
import { isPlatform } from '@ionic/angular';
import { AppConfigService } from 'src/app/services/app-config.service';

@Component({
  selector: 'app-pay-modal',
  templateUrl: './pay-modal.page.html',
  styleUrls: ['./pay-modal.page.scss'],
})
export class PayModalPage extends BasePage implements OnInit {

  @ViewChild(StripePaymentElementComponent) stripePaymentElement: StripePaymentElementComponent;

  @Input() userPackage: UserPackage;
  @Input() place: Place;

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  public isSaving: boolean;

  public stripeInstance: StripeInstance;

  public elementsOptions: StripeElementsOptions = {};

  constructor(injector: Injector,
    private appConfigService: AppConfigService,
    private stripeFactory: StripeFactoryService) {
    super(injector);
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  async ngOnInit() {

    this.elementsOptions.locale = this.preference.lang;

    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }

    this.loadPaymentConfig();
  }

  async loadPaymentConfig() {
    try {
      this.showLoadingView({ showOverlay: false });
      const config = await this.appConfigService.load();
      console.log(config?.stripePublicKey);
      this.stripeInstance = this.stripeFactory.create(config?.stripePublicKey);
      const secret = await this.userPackage.createStripePaymentIntent(this.place.id);
      this.elementsOptions.clientSecret = secret;
      this.showContentView();
    } catch {
      this.showErrorView();
    }
  }

  onDismiss(paymentIntent: PaymentIntent = null) {
    return this.modalCtrl.dismiss(paymentIntent);
  }

  async onSubmit() {

    try {

      this.isSaving = true;

      this.stripeInstance.confirmPayment({
        elements: this.stripePaymentElement.elements,
        redirect: 'if_required',
      }).subscribe((result: any) => {

        if (result.error) {
          this.showAlert(result.error.message);
        } else {
          this.onDismiss(result.paymentIntent);
        }

        this.isSaving = false;
      });

    } catch (error) {
      this.isSaving = false;
      this.translate.get('ERROR_NETWORK')
        .subscribe(str => this.showToast(str));
    }

  }

}
