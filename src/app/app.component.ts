import { Component, Injector, NgZone } from '@angular/core';
import { environment } from '../environments/environment';
import * as Parse from 'parse';
import { LocalStorage } from './services/local-storage';
import { User } from './services/user-service';
import { Installation } from './services/installation';
import { Category } from './services/categories';
import { Place } from './services/place-service';
import { Review } from './services/review-service';
import { Post } from './services/post';
import { Slide } from './services/slider-image';
import { AudioService } from './services/audio-service';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { nanoid } from 'nanoid';
import { App } from '@capacitor/app';
import { BasePage } from './pages/base-page/base-page';
import { NavigationEnd } from '@angular/router';
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard';
import { isPlatform } from '@ionic/angular';
import OneSignal from 'onesignal-cordova-plugin';
import { NotificationReceivedEvent, OpenedEvent } from 'onesignal-cordova-plugin/types/Notification';
import Utils from './utils';
import { NotificationPage } from './pages/notification/notification.page';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent extends BasePage {

  constructor(injector: Injector,
    private storage: LocalStorage,
    private userService: User,
    private installationService: Installation,
    private audioService: AudioService,
    private ngZone: NgZone) {
    super(injector);
    this.initializeApp();
  }

  enableMenuSwipe(): boolean {
    return true;
  }

  async initializeApp() {

    this.translate.setDefaultLang(environment.defaultLang);

    this.setupParse();
    this.setupEvents();

    if (Capacitor.isNativePlatform()) {
      this.setupStatusBar();
      this.setupNativeAudio();
      await Utils.sleep(2000);
      SplashScreen.hide();
    } else {
      this.setupFacebookWeb();
    }

    this.loadUser();
  }

  async loadUser() {
    try {

      this.showLoadingView({ showOverlay: false });

      const user = User.getCurrent();

      if (!user) {
        const user = await this.userService.loginAnonymously();
        await this.userService.becomeWithSessionToken(user.getSessionToken());
      }

      await this.setupDefaults();

      if (Capacitor.isNativePlatform()) {
        this.setupPush();
        this.setupOneSignal();
      }

      this.showContentView();
      this.updateInstallation();
      this.loadCurrentUser();

    } catch (error) {
      this.showErrorView();

      if (error.code === 209) {
        this.onLogOut();
      }
    }
  }

  setupFacebookWeb() {

    (window as any).fbAsyncInit = () => {
      (FB as any).init({
        appId: environment.fbId,
        cookie: true,
        xfbml: true,
        version: 'v5.0',
      });
    };

    // Load the SDK asynchronously
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  async setupDefaults() {

    try {

      const supportedLangs = ['en', 'es', 'ar'];
      const browserLang = navigator.language.substr(0, 2);

      const promises = [
        this.storage.getLang(),
        this.storage.getUnit(),
        this.storage.getIsDarkModeEnabled(),
        this.storage.getIsPushEnabled(),
      ];

      let [
        lang,
        unit,
        isDarkModeEnabled,
        isPushEnabled
      ] = await Promise.all(promises);

      if (lang === null && supportedLangs.indexOf(browserLang) !== -1) {
        lang = browserLang;
      }

      lang = lang || environment.defaultLang;

      if (lang === 'ar') {
        document.dir = 'rtl';
      } else {
        document.dir = 'ltr';
      }

      unit = unit || environment.defaultUnit;
      this.storage.setUnit(unit);
      this.preference.unit = unit;

      this.storage.setLang(lang);
      this.translate.use(lang);
      this.preference.lang = lang;

      this.preference.isDarkModeEnabled = isDarkModeEnabled;

      if (isDarkModeEnabled) {
        this.toggleDarkTheme(isDarkModeEnabled);
      }

      this.preference.isPushEnabled = isPushEnabled;

    } catch {
      this.preference.lang = environment.defaultLang;
      this.preference.unit = environment.defaultUnit;
    }

  }

  setupNativeAudio() {

    let path = 'pristine.mp3';

    if (isPlatform('ios')) {
      path = 'public/assets/audio/pristine.mp3';
    }

    this.audioService.preload('ping', path);
  }

  setupEvents() {

    window.addEventListener('user:login', () => {
      this.loadCurrentUser();
      this.updateInstallation();
    });

    window.addEventListener('user:logout', () => {
      this.onLogOut();
    });

    window.addEventListener('installation:update', (event: CustomEvent) => {
      this.updateInstallation(event.detail);
    });

    window.addEventListener('lang:change', (event: CustomEvent) => {
      this.onChangeLang(event.detail);
    });

    window.addEventListener('dark-mode:change', (event: CustomEvent) => {
      const isDarkModeEnabled = event.detail;
      this.toggleDarkTheme(isDarkModeEnabled);
      this.storage.setIsDarkModeEnabled(isDarkModeEnabled);
      this.preference.isDarkModeEnabled = isDarkModeEnabled;
    });

    const topLevelRoutes = [
      '/',
      '/1',
      '/1/home',
      '/1/explore',
      '/1/posts',
      '/1/profile'
    ];

    this.router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        this.preference.isSubPage = !topLevelRoutes.includes(val.url);
        const arr = this.router.url.split('/');
        this.preference.currentTab = `/1/${arr[2]}`;
      }
    });

    if (!environment.production) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

      prefersDark.addEventListener(
        'change',
        (mediaQuery) => this.toggleDarkTheme(mediaQuery.matches)
      );
    }
  }

  toggleDarkTheme(isDarkModeEnabled: boolean) {

    // Add body class to body
    document.body.classList.toggle('dark', isDarkModeEnabled)

    // Update theme-color meta tag
    const style = window.getComputedStyle(document.body);

    // When the dark class is applied,
    // the value of the --ion-color-primary
    // is set to a dark color (#222428)

    const primaryColor = style.getPropertyValue('--ion-color-primary').trim();

    document.querySelector('meta[name="theme-color"]')
      .setAttribute('content', primaryColor);

    // Update keyboard style

    if (Capacitor.isNativePlatform()) {

      if (isDarkModeEnabled) {
        Keyboard.setStyle({
          style: KeyboardStyle.Dark,
        });

        if (isPlatform('android')) {
          StatusBar.setBackgroundColor({
            color: primaryColor
          });
        }

      } else {
        Keyboard.setStyle({
          style: KeyboardStyle.Light,
        });

        if (isPlatform('android')) {
          StatusBar.setBackgroundColor({
            color: environment.androidHeaderColor
          });
        }
      }
    }

  }

  async onChangeLang(lang: string) {
    try {
      await this.updateInstallation({ localeIdentifier: lang });
      await this.storage.setLang(lang);
    } catch (error) {
      console.log(error);
    }

    window.location.reload();
  }

  async loadCurrentUser() {
    const user = User.getCurrent();

    try {
      await user?.fetch();
    } catch (error) {
      if (error.code === 209) {
        this.onLogOut();
      }
    }
  }

  setupParse() {
    Slide.getInstance();
    Post.getInstance();
    Review.getInstance();
    Place.getInstance();
    Category.getInstance();
    User.getInstance();

    Parse.initialize(environment.appId);
    (Parse as any).serverURL = environment.serverUrl;
    (Parse as any).idempotency = true;
  }

  async presentNotificationModal(notification: any) {

    const modal = await this.modalCtrl.create({
      component: NotificationPage,
      componentProps: { notification }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {

      let page = null;
      let queryParams = {};

      if (data.placeId) {
        page = '/1/home/places/' + data.placeId;
      } else if (data.postId) {
        page = '/1/home/posts/' + data.postId;
      } else if (data.categoryId) {
        page = '/1/home/places';
        queryParams = { cat: data.categoryId };
      }

      this.router.navigate([page], { queryParams });
    }
  }

  setupPush() {

    PushNotifications.addListener('registration', async (token: Token) => {

      console.log('registration: ' + token.value);

      const appInfo = await App.getInfo();

      const info = await Device.getInfo();
      const languageCode = await Device.getLanguageCode();
      const id = await this.storage.getInstallationObjectId();

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const installationId = nanoid();

      const data: any = {
        channels: [],
        deviceToken: token.value,
        appName: appInfo.name,
        appVersion: appInfo.version,
        appIdentifier: appInfo.id,
        deviceType: info.platform,
        localeIdentifier: this.preference.lang || languageCode.value,
        timeZone: timezone,
        badge: 0,
      }

      if (!id) {
        data.installationId = installationId;
      }

      const user = User.getCurrent();
      data.user = user?.toPointer();

      const { objectId } = await this.installationService.save(id, data);

      await this.storage.setInstallationObjectId(id || objectId);

      const installation = await this.installationService.getOne(id || objectId);

      const granted: PermissionState = 'granted';
      const { receive } = await PushNotifications.checkPermissions();

      if (receive === granted && installation.isPushEnabled) {
        this.storage.setIsPushEnabled(true);
        this.preference.isPushEnabled = true;
      }

    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.log('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ' + JSON.stringify(notification));

      if (environment.oneSignal?.appId) {
        return;
      }

      let notificationData = notification.data;

      if (isPlatform('android')) {
        notificationData = JSON.parse(notification.data.data);
      }

      this.presentNotificationModal(notificationData);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(action));

      if (environment.oneSignal?.appId) {
        return;
      }

      let notificationData = action.notification.data;

      if (isPlatform('android')) {
        notificationData = JSON.parse(action.notification.data.data);
      }

      let page = null;
      let queryParams = {};

      if (notificationData.placeId) {
        page = '/1/home/places/' + notificationData.placeId;
      } else if (notificationData.postId) {
        page = '/1/home/posts/' + notificationData.postId;
      } else if (notificationData.categoryId) {
        page = '/1/home/places';
        queryParams = { cat: notificationData.categoryId };
      }

      if (page) {
        this.ngZone.run(() => {
          this.router.navigate([page], { queryParams });
        });
      }
    });
  }

  setupOneSignal() {

    const appId = environment?.oneSignal?.appId;

    if (appId) {

      OneSignal.setAppId(appId);

      OneSignal.setNotificationWillShowInForegroundHandler((event: NotificationReceivedEvent) => {

        const notification = (event as any).notification
        console.log('[ONE_SIGNAL] push received', notification);

        const notificationData: any = {
          ...notification.additionalData
        };

        notificationData.title = notification.title;
        notificationData.body = notification.body;
        notificationData.image_url = notification.bigPicture;

        if (this.platform.is('ios') &&
          typeof notification.attachments === 'object' &&
          notification.attachments !== null) {
          for (const [key, value] of Object.entries(notification.attachments)) {
            notificationData.image_url = value;
          }
        }

        this.presentNotificationModal(notificationData);

        this.audioService.play('ping');

        event.complete(null);
      });

      OneSignal.setNotificationOpenedHandler((res: OpenedEvent) => {
        console.log('[ONE_SIGNAL] push opened', res);

        const notificationData: any = res.notification.additionalData;

        let page = null;
        let queryParams = {};

        if (notificationData.placeId) {
          page = '/1/home/places/' + notificationData.placeId;
        } else if (notificationData.postId) {
          page = '/1/home/posts/' + notificationData.postId;
        } else if (notificationData.categoryId) {
          page = '/1/home/places';
          queryParams = { cat: notificationData.categoryId };
        }

        if (page) {
          this.ngZone.run(() => {
            this.router.navigate([page], { queryParams });
          });
        }

      });
    }
  }

  setupStatusBar() {
    if (this.platform.is('ios')) {
      StatusBar.setStyle({ style: Style.Dark });
    } else {
      StatusBar.setBackgroundColor({
        color: environment.androidHeaderColor
      });
    }
  }

  async updateInstallation(data: any = {}) {

    try {

      if (Capacitor.isNativePlatform()) {

        const payload: any = {
          user: null,
          ...data,
        };

        const id = await this.storage.getInstallationObjectId();

        if (!id) {
          return;
        }

        const user = User.getCurrent();
        payload.user = user?.toPointer();

        const res = await this.installationService.save(id, payload);
        console.log('Installation updated', res);
      }

    } catch (error) {
      console.log(error);
    }

  }

  async onLogOut() {

    try {

      await this.showLoadingView({ showOverlay: true });
      await this.userService.logout();
      if (Capacitor.isNativePlatform()) {
        await this.updateInstallation();
      }
      await this.dismissLoadingView();

      window.location.reload();

    } catch (err) {

      if (err.code === 209) {
        window.location.reload();
      }

      this.dismissLoadingView();
    }

  }

}
