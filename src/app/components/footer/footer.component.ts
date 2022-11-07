import { Component, OnInit } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Preference } from 'src/app/services/preference';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  public year: Number;

  public facebook: string;
  public instagram: string;
  public phone: string;
  public whatsapp: string;
  public email: string;

  public googlePlayUrl: string;
  public appStoreUrl: string;

  constructor(
    public preference: Preference,
    public appConfigService: AppConfigService) { }

  ngOnInit() {
    this.year = new Date().getFullYear();
    this.loadData();
  }

  async loadData() {
    try {
      const config = await this.appConfigService.load();
      this.facebook = config?.about?.facebook;
      this.instagram = config?.about?.instagram;
      this.phone = config?.about?.phone;
      this.whatsapp = config?.about?.whatsapp;
      this.email = config?.about?.email;
      this.googlePlayUrl = config?.about?.googlePlayUrl;
      this.appStoreUrl = config?.about?.appStoreUrl;
    } catch (error) {
     
    }
  }

  openUrl(url: string) {
    if (!url) return;
    Browser.open({ url });
  }

}
