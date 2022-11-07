import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MapPage } from './map';
import { SharedModule } from '../../shared.module';
import { GoogleMapsModule } from '@angular/google-maps';
import { PlaceSheetModalPageModule } from '../place-sheet-modal/place-sheet-modal.module';
 
@NgModule({
  declarations: [
    MapPage,
  ],
  imports: [
    SharedModule,
    GoogleMapsModule,
    PlaceSheetModalPageModule,
    RouterModule.forChild([
      {
        path: '',
        component: MapPage
      }
    ])
  ]
})
export class MapPageModule {}
