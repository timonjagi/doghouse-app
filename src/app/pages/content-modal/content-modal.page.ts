import { Component, OnInit, Input, HostListener } from '@angular/core';
import { isPlatform, ModalController } from '@ionic/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-content-modal',
  templateUrl: './content-modal.page.html',
  styleUrls: ['./content-modal.page.scss'],
})
export class ContentModalPage implements OnInit {

  @HostListener('window:popstate')
  onPopState() {
    if (isPlatform('android') && isPlatform('mobileweb')) {
      this.modalCtrl.dismiss();
    }
  }

  @Input() content: string;

  public safeContent: SafeHtml;

  constructor(private modalCtrl: ModalController,
    private sanitizer: DomSanitizer) { }

  ngOnInit() {

    if (isPlatform('android') && isPlatform('mobileweb')) {
      history.pushState({ modal: true }, null);
    }

    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.content);
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

}
