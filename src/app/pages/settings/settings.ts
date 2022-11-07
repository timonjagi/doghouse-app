
import { Component, HostListener, Injector } from '@angular/core';
import { LocalStorage } from '../../services/local-storage';
import { BasePage } from '../base-page/base-page';
import { WalkthroughPage } from '../walkthrough/walkthrough';
import { AppConfigService } from 'src/app/services/app-config.service';
import { isPlatform } from '@ionic/angular';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class SettingsPage extends BasePage {

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  public canShowIntroButton: boolean;
  public isRequestingPush: boolean;
  public canRequestPushPermission: boolean;

  constructor(injector: Injector,
    private appConfigService: AppConfigService,
    private storage: LocalStorage) {
    super(injector);
  }

  enableMenuSwipe() {
    return true;
  }

  ngOnInit() {
    this.loadAppConfig();

    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  async loadAppConfig() {
    try {
      const config = await this.appConfigService.load();
      this.canShowIntroButton = !config?.slides?.disabled;
    } catch (err) {
      console.log(err);
    }
  }

  async onChangeIsPushEnabled(event: any) {

    if (!event) return;

    const isPushEnabled = event.detail.checked;

    if (Capacitor.isNativePlatform() && isPlatform('ios') && isPushEnabled) {

      const promptPermissionState: PermissionState = 'prompt';
      const deniedPermissionState: PermissionState = 'denied';

      const statusPush = await PushNotifications.checkPermissions();
      
      this.canRequestPushPermission = statusPush.receive === promptPermissionState;

      if (this.canRequestPushPermission) {
        this.onRequestPushPermission();
        return;
      } else if (statusPush.receive === deniedPermissionState) {
        this.translate.get('PUSH_DENIED').subscribe(str => {
          this.showToast(str);
        });
        this.preference.isPushEnabled = false;
      }
    }

    this.updatePushSettings(isPushEnabled);
  }

  updatePushSettings(isPushEnabled: boolean) {

    window.dispatchEvent(new CustomEvent('installation:update', {
      detail: { isPushEnabled }
    }))

    this.storage.setIsPushEnabled(isPushEnabled);
  }

  async onRequestPushPermission() {

    try {
      this.isRequestingPush = true;

      const result = await PushNotifications.requestPermissions();

      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else if (result.receive === 'denied') {
        this.preference.isPushEnabled = false;
        this.storage.setIsPushEnabled(false);
        this.translate.get('PUSH_DENIED').subscribe(str => {
          this.showToast(str);
        });
      }

      this.isRequestingPush = false;
    } catch {
      this.isRequestingPush = false;
    }
  }

  onChangeDarkMode(event: any) {
    if (!event) return;

    const isDarkModeEnabled = event.detail.checked;

    window.dispatchEvent(new CustomEvent('dark-mode:change', {
      detail: isDarkModeEnabled
    }));
  }

  onChangeUnit(event: any) {

    if (!event) return;

    const unit = event.detail.value;

    this.storage.setUnit(unit);
    this.preference.unit = unit;
  }

  onChangeLang(lang: string) {
    window.dispatchEvent(new CustomEvent('lang:change', {
      detail: lang
    }));
  }

  async presentWalkthroughModal() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: WalkthroughPage
    });

    await modal.present();

    this.dismissLoadingView();

  }

}
