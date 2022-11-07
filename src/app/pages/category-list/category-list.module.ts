import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared.module';

import { CategoryListPage } from './category-list';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  declarations: [
    CategoryListPage,
  ],
  imports: [
    IonicModule,
    SharedModule,
    SwiperModule,
    RouterModule.forChild([
      {
        path: '',
        component: CategoryListPage
      }
    ])
  ],
  exports: [
    CategoryListPage
  ]
})
export class CategoryListPageModule {}
