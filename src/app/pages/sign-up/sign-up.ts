
import { Component, HostListener, Injector } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { BasePage } from '../base-page/base-page';
import { User } from '../../services/user-service';
import { isPlatform } from '@ionic/angular';
import { AppConfigService } from 'src/app/services/app-config.service';
import { ContentModalPage } from '../content-modal/content-modal.page';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.scss']
})
export class SignUpPage extends BasePage {

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  public form: FormGroup;

  constructor(injector: Injector,
    private appConfigService: AppConfigService,
    private userService: User) {

    super(injector);

    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', Validators.email),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      terms: new FormControl(false, Validators.requiredTrue),
    });
  }

  enableMenuSwipe() {
    return false;
  }

  ngOnInit() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }
  }

  onDismiss() {
    return this.modalCtrl.dismiss();
  }

  isFieldValid(formControl: AbstractControl) {
    return formControl.valid;
  }

  async onPresentContentModal() {

    await this.showLoadingView({ showOverlay: true });

    const appConfig = await this.appConfigService.load();

    const modal = await this.modalCtrl.create({
      component: ContentModalPage,
      componentProps: { content: appConfig.about.terms }
    });

    await modal.present();

    this.dismissLoadingView();
  }

  async onSubmit() {

    if (this.form.invalid) {
      const message = await this.getTrans('INVALID_FORM');
      return this.showToast(message);
    }

    const formData = Object.assign({}, this.form.value);

    if (formData.password !== formData.confirmPassword) {
      const message = await this.getTrans('PASSWORD_DOES_NOT_MATCH');
      return this.showToast(message);
    }

    formData.name = formData.name.trim();
    formData.username = formData.username.trim();
    formData.email = formData.email.trim();
    formData.password = formData.password.trim();

    if (formData.email === '') {
      delete formData.email;
    }

    delete formData.confirmPassword;

    try {

      await this.showLoadingView({ showOverlay: false });

      const { sessionToken } = await this.userService.signUpInCloud(formData);

      const user = await this.userService.becomeWithSessionToken(sessionToken);

      this.showContentView();
      await this.onDismiss();

      window.dispatchEvent(new CustomEvent('user:login', { detail: user }));

    } catch (err) {

      this.showContentView();

      if (err.code === 202) {
        this.translate.get('USERNAME_TAKEN')
          .subscribe(str => this.showToast(str));
      } else if (err.code === 203) {
        this.translate.get('EMAIL_TAKEN')
          .subscribe(str => this.showToast(str));
      } else if (err.code === 125) {
        this.translate.get('EMAIL_INVALID')
          .subscribe(str => this.showToast(str));
      } else {
        this.translate.get('ERROR_NETWORK').
          subscribe(str => this.showToast(str));
      }

    }

  }

}
