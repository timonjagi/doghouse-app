import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlaceDetailPage } from './place-detail';
import { SharedModule } from '../../shared.module';
import { ReviewAddPageModule } from '../review-add/review-add.module';
import { SharePageModule } from '../share/share.module';
import { LightboxModule } from 'src/app/components/lightbox/lightbox.module';
import { DirectivesModule } from 'src/app/directives/directives.module';
import { SwiperModule } from 'swiper/angular';
 
@NgModule({
  declarations: [
    PlaceDetailPage,
  ],
  imports: [
    SharedModule,
    ReviewAddPageModule,
    SharePageModule,
    LightboxModule,
    DirectivesModule,
    SwiperModule,
    RouterModule.forChild([
      {
        path: '',
        component: PlaceDetailPage
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlaceDetailPageModule {}
