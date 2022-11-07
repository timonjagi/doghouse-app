import { Component, Injector, ViewChild } from '@angular/core';
import { Post } from '../../services/post';
import { BasePage } from '../base-page/base-page';
import { IonContent } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { SharePage } from '../share/share.page';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.html',
  styleUrls: ['./post-detail.scss'],
})
export class PostDetailPage extends BasePage {

  @ViewChild(IonContent, { static: true }) container: IonContent;

  public post: Post;
  public htmlBody: any;

  public webSocialShare: { show: boolean, share: any, onClosed: any } = {
    show: false,
    share: {
      config: [{
        facebook: {
          socialShareUrl: '',
        },
      }, {
        twitter: {
          socialShareUrl: '',
        }
      }, {
        whatsapp: {
          socialShareText: '',
          socialShareUrl: '',
        }
      }, {
        copy: {
          socialShareUrl: '',
        }
      }]
    },
    onClosed: () => {
      this.webSocialShare.show = false;
    }
  };

  constructor(injector: Injector,
    private sanitizer: DomSanitizer,
    private postService: Post) {
    super(injector);
  }

  enableMenuSwipe() {
    return true;
  }

  ngOnInit() {}

  ionViewDidEnter() {
    this.showLoadingView({ showOverlay: false });
    this.loadPost();
  }

  async loadPost() {
    try {
      this.post = await this.postService.loadOne(this.getParams().id);

      if (this.post.htmlBody) {
        this.htmlBody = this.sanitizer
        .bypassSecurityTrustHtml(this.post.htmlBody);
      }

      this.setPageTitle(this.post.title);

      this.setMetaTags({
        title: this.post.title,
        description: this.post.body,
        image: this.post.image ? this.post.image.url() : '',
        slug: this.post.getSlug()
      });

      this.webSocialShare.share.config.forEach((item: any) => {
        if (item.whatsapp) {
          item.whatsapp.socialShareUrl = this.getShareUrl(this.post.getSlug());
        } else if (item.facebook) {
          item.facebook.socialShareUrl = this.getShareUrl(this.post.getSlug());
        } else if (item.twitter) {
          item.twitter.socialShareUrl = this.getShareUrl(this.post.getSlug());
        } else if (item.copy) {
          item.copy.socialShareUrl = this.getShareUrl(this.post.getSlug());
        }
      });

      this.showContentView();
      
    } catch (error) {

      if (error.code === 101) {
        this.showEmptyView();
      } else {
        this.showErrorView();
      }

      this.translate.get('ERROR_NETWORK')
      .subscribe(str => this.showToast(str));
    }
  }

  onContentTouched(ev: any = {}) {
    const href = ev.target.getAttribute('href');
    if (href) {
      ev.preventDefault();
      this.openUrl(href);
    }
  }

  async onShare () {

    if (this.isCapacitor) {

      try {
        const url = this.getShareUrl(this.post.getSlug());

        await Share.share({
          url: url,
        });

      } catch (err) {
        console.warn(err)
      }
      
    } else if (this.isPwa || this.isMobile) {
      this.webSocialShare.show = true;
    } else {
      this.openShareModal();
    }
   
  }

  async openShareModal() {
    const modal = await this.modalCtrl.create({
      component: SharePage,
    })
    return await modal.present();
  }

}
