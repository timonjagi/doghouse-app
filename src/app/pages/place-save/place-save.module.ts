import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlaceSavePage } from './place-save';
import { SharedModule } from '../../shared.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { PayModalPageModule } from '../pay-modal/pay-modal.module';
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
  declarations: [
    PlaceSavePage,
  ],
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PayModalPageModule,
    GoogleMapsModule,
    RouterModule.forChild([
      {
        path: '',
        component: PlaceSavePage
      }
    ])
  ]
})
export class PlaceSavePageModule {}
