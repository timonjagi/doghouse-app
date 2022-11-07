
import { Component, HostListener, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from '../../services/user-service';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';
import { SignUpPage } from '../sign-up/sign-up';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Device } from '@capacitor/device';
import { SignInWithApple, SignInWithAppleOptions, SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { GoogleAuth } from '@fmendoza/capacitor-google-auth';
import { isPlatform } from '@ionic/angular';
import * as Parse from 'parse';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.scss']
})
export class SignInPage extends BasePage {

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  public form: FormGroup;

  public isFacebookLoginEnabled: boolean;
  public isGoogleLoginEnabled: boolean;
  public isAppleLoginEnabled: boolean;

  public isLoadingConfig: boolean;

  public isLoading: boolean;

  public loginListener: any;

  constructor(injector: Injector,
    private userService: User,
    private appConfigService: AppConfigService) {
    super(injector);
  }

  async ngOnInit() {

    if (!Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: environment.googleClientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }

    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }

    this.loginListener = () => this.onDismiss();

    window.addEventListener('user:login', this.loginListener);

    this.form = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });

    this.loadAppConfig();
  }

  ngOnDestroy() {
    window.removeEventListener('user:login', this.loginListener);
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  onDismiss() {
    return this.modalCtrl.dismiss();
  }

  async loadAppConfig() {

    try {

      const info = await Device.getInfo();
      const deviceVersion = parseInt(info.osVersion);

      this.isLoadingConfig = true;
      const config = await this.appConfigService.load();
      this.isFacebookLoginEnabled = config?.auth?.isFacebookLoginEnabled;
      this.isGoogleLoginEnabled = config?.auth?.isGoogleLoginEnabled;

      this.isAppleLoginEnabled = config?.auth?.isAppleLoginEnabled &&
        deviceVersion >= 13 &&
        this.platform.is('capacitor') &&
        this.platform.is('ios');

      this.isLoadingConfig = false;

    } catch (error) {
      this.isLoadingConfig = false;
    }
  }

  onLoginSuccess(user: User) {
    this.isLoading = false;
    window.dispatchEvent(new CustomEvent('user:login', {
      detail: user
    }));
  }

  onFailedLogin(err: any) {

    this.isLoading = false;

    if (err instanceof Parse.Error) {
      if (err.code === 101) {
        this.translate
          .get('INVALID_CREDENTIALS')
          .subscribe(str => this.showToast(str));
      } else {
        this.translate
          .get('ERROR_NETWORK')
          .subscribe(str => this.showToast(str));
      }
    }
  }

  async onAppleButtonTouched() {
    try {
      let options: SignInWithAppleOptions = {
        clientId: null,
        redirectURI: null,
        scopes: 'email name',
        state: null,
        nonce: null,
      };

      const { response }: SignInWithAppleResponse = await SignInWithApple.authorize(options);

      const authData = {
        id: response.user,
        token: response.identityToken,
      };

      const extraData: any = {};

      if (response.givenName) {
        extraData.name = response.givenName;
      }

      if (response.familyName) {
        extraData.name += ' ' + response.familyName;
      }

      if (response.email) {
        extraData.emailAddress = response.email;
      }

      this.isLoading = true;

      const { sessionToken } = await this.userService.loginInCloud({
        provider: 'apple',
        authData,
        extraData,
      });

      const user = await this.userService.becomeWithSessionToken(sessionToken);

      this.onLoginSuccess(user);

    } catch (error) {
      this.onFailedLogin(error);
    }
  }

  async onFacebookButtonTouched() {

    const result = await FacebookLogin.login({
      permissions: ['public_profile', 'email'],
    });

    const token = await FacebookLogin.getCurrentAccessToken();

    if (result.accessToken) {
      this.loggedIntoFacebook({
        id: token.accessToken.userId,
        access_token: token.accessToken.token,
      });
    }

  }

  async loggedIntoFacebook(authData: any) {

    try {
      this.isLoading = true;

      const { sessionToken } = await this.userService.loginInCloud({
        authData: authData,
        provider: 'facebook',
      });

      const user = await this.userService.becomeWithSessionToken(sessionToken);

      this.onLoginSuccess(user);
    } catch (error) {
      this.onFailedLogin(error);
    }
  }

  async onGoogleButtonTouched() {
    try {
      const googleUser = await GoogleAuth.signIn();
      this.loggedIntoGoogle(googleUser);
    } catch (error) {
      console.log(error);
    }
  }

  async loggedIntoGoogle(res: any) {
    console.log("Logged into Google", res);

    try {

      const authData = {
        id: res.id,
        access_token: res.authentication.accessToken,
        id_token: res.authentication.idToken,
      };

      this.isLoading = true;

      const { sessionToken } = await this.userService.loginInCloud({
        provider: 'google',
        authData,
      });

      const user = await this.userService.becomeWithSessionToken(sessionToken);

      this.onLoginSuccess(user);

    } catch (err) {
      this.onFailedLogin(err);
    }
  }

  async onSubmit() {

    try {

      if (this.form.invalid) {
        const message = await this.getTrans('INVALID_FORM');
        return this.showToast(message);
      }

      const formData = Object.assign({}, this.form.value);

      formData.username = formData.username.trim();
      formData.password = formData.password.trim();

      this.isLoading = true;


      const { sessionToken } = await this.userService.loginInCloud(formData);
      const user = await this.userService.becomeWithSessionToken(sessionToken);

      this.onLoginSuccess(user);

    } catch (err) {
      this.onFailedLogin(err);
    }
  }

  async onPresentForgotPasswordModal() {
    const modal = await this.modalCtrl.create({
      component: ForgotPasswordPage
    });

    return await modal.present();
  }

  async onPresentSignUpModal() {
    const modal = await this.modalCtrl.create({
      component: SignUpPage
    });

    return await modal.present();
  }

}
