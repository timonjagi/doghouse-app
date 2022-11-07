import { NgModule } from '@angular/core';
import { WalkthroughPage } from './walkthrough';
import { SharedModule } from '../../shared.module';
import { SwiperModule } from 'swiper/angular';
 
@NgModule({
  declarations: [
    WalkthroughPage,
  ],
  imports: [
    SharedModule,
    SwiperModule,
  ],
})
export class WalkthroughPageModule {}
