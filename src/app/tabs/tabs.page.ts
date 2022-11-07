import { Component, ElementRef, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Platform, IonTabs, AnimationController, Animation, isPlatform, IonRouterOutlet } from '@ionic/angular';
import { BasePage } from '../pages/base-page/base-page';
import { Preference } from '../services/preference';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss']
})
export class TabsPage extends BasePage implements OnInit {

  @ViewChild(IonTabs, { static: true }) tabs: IonTabs;
  @ViewChild('tabBarMobile', { static: false, read: ElementRef }) ionTabBar: ElementRef;

  @HostListener('ionScroll', ['$event']) async onScroll($event: any) {

    const isScrollingDown = $event.detail.velocityY > 0;

    if (this.ionTabBar && isScrollingDown && !this.isTabsHidden && !this.isAnimating) {

      this.isTabsHidden = true;
      this.isAnimating = true;

      this.animation.direction('normal').play();
    }

  }

  @HostListener('ionScrollEnd') async onScrollEnd() {

    if (this.ionTabBar && this.isTabsHidden && !this.isAnimating) {

      this.isTabsHidden = false;
      this.isAnimating = true;

      this.animation.direction('reverse').play();
    }
  }

  public isTabsHidden = false;
  public isAnimating: boolean;
  public animation: Animation;

  public tabNames: string[];
  public currentTabName: string;
  public topLevelRoutes: string[];

  constructor(injector: Injector,
    public platform: Platform,
    public preference: Preference,
    private routerOutlet: IonRouterOutlet,
    private animationCtrl: AnimationController) {
    super(injector);
  }

  enableMenuSwipe(): boolean {
    return true;
  }

  ngOnInit() {

    this.tabNames = ['home', 'explore', 'posts', 'profile'];

    this.topLevelRoutes = [
      '/',
      '/1',
      '/1/home',
      '/1/explore',
      '/1/posts',
      '/1/profile',
    ];

    if (Capacitor.isNativePlatform() && isPlatform('android')) {
      this.subscribeToRouterChangeEvent();
      this.subscribeToBackButtonEvent();
    }
  }

  ionViewDidEnter() {
    this.setupAnimation();
  }

  subscribeToRouterChangeEvent() {
    this.router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        const arr = this.router.url.split('/');
        this.currentTabName = arr[2];
      }
    });
  }

  subscribeToBackButtonEvent() {

    let lastTimeBackPress: number = 0;
    const limit: number = 2000;

    this.platform.backButton.subscribeWithPriority(-1, () => {

      const canGoBack = this.routerOutlet.canGoBack(1, this.currentTabName);
      const isRoot = this.topLevelRoutes.includes(this.router.url)

      if (!canGoBack && isRoot) {
        const threshold = new Date().getTime() - lastTimeBackPress;

        if (threshold < limit) {
          App.exitApp();
        } else {
          this.translate.get('EXIT_APP')
            .subscribe(async str => {
              this.showToast(str, null, limit);
            });

          lastTimeBackPress = new Date().getTime();
        }
      }
    });
  }

  setupAnimation() {
    this.animation = this.animationCtrl.create()
      .addElement(this.ionTabBar.nativeElement)
      .easing('ease-in-out')
      .onFinish(() => this.isAnimating = false)
      .duration(500)
      .keyframes([
        { offset: 0, opacity: '1', transform: 'translateY(0px)' },
        { offset: 1, opacity: '0', transform: 'translateY(200px)' }
      ])
  }

  /* 
   * Reset tabs stack
   */

  handleTabClick = (event: MouseEvent) => {
    const { tab } = event.composedPath().find((element: any) =>
      element.tagName === 'ION-TAB-BUTTON') as EventTarget & { tab: string };

    let deep = 1;
    let canGoBack = false;

    const deepFn = () => {
      if (this.tabs.outlet.canGoBack(deep, tab)) {
        canGoBack = true;
        deep++;
        deepFn();
      }
    }

    deepFn();

    if (this.tabNames.includes(tab) && canGoBack) {
      event.stopImmediatePropagation();
      return this.tabs.outlet.pop(deep - 1, tab);
    }
  }
}
