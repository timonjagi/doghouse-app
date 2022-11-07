import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlaceListPage } from './place-list';
import { SharedModule } from '../../shared.module'; 
import { FilterPlacePageModule } from '../filter-place/filter-place.module';
import { LocationSelectPageModule } from '../location-select/location-select.module';
import { FormsModule } from '@angular/forms';
import { SwiperModule } from 'swiper/angular';
@NgModule({
  declarations: [
    PlaceListPage,
  ],
  imports: [
    SharedModule,
    FormsModule,
    SwiperModule,
    FilterPlacePageModule,
    LocationSelectPageModule,
    RouterModule.forChild([
      {
        path: '',
        component: PlaceListPage
      }
    ])
  ]
})
export class PlaceListPageModule {}
