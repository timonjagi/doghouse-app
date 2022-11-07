import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LightboxComponent } from './lightbox.component';

@NgModule({
  declarations: [
    LightboxComponent,
  ],
  imports: [
    IonicModule
  ],
  exports: [
    LightboxComponent
  ]
})
export class LightboxModule {}
